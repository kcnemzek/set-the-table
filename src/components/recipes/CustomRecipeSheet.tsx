"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Share2, Pencil, ClipboardPaste, Camera, Loader2 } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import { CATEGORIES, getRecipeEmoji } from "@/lib/recipe-emoji";
import { parseIngredientText } from "@/lib/parse-ingredient";
import { shareRecipe } from "@/lib/share-recipe";
import type { CustomRecipe, ExtendedIngredient } from "@/types";

const AISLES = [
  "Produce",
  "Meat & Seafood",
  "Dairy",
  "Grains & Pasta",
  "Canned & Dry Goods",
  "Baking",
  "Spices & Herbs",
  "Oils & Condiments",
  "Frozen",
  "Beverages",
  "Nuts & Snacks",
  "Miscellaneous",
];

interface IngredientRow {
  text: string;
  aisle: string;
}

const emptyRow = (): IngredientRow => ({ text: "", aisle: "Miscellaneous" });

function ingredientToRow(i: ExtendedIngredient): IngredientRow {
  const text =
    i.original?.trim() ||
    [i.amountDisplay ?? (i.amount ? String(i.amount) : ""), i.unit, i.name]
      .filter(Boolean)
      .join(" ");
  return { text, aisle: i.aisle };
}

async function resizeImageToBase64(
  file: File,
  maxSize = 1120
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}

interface CustomRecipeSheetProps {
  open: boolean;
  onClose: () => void;
  existing?: CustomRecipe;
}

export default function CustomRecipeSheet({
  open,
  onClose,
  existing,
}: CustomRecipeSheetProps) {
  const { dispatch } = useAppContext();
  const [isEditing, setIsEditing] = useState(!existing);

  // Form fields
  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [servings, setServings] = useState(String(existing?.servings || ""));
  const [directions, setDirections] = useState(existing?.directions ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [emoji, setEmoji] = useState(existing?.emoji ?? "");
  const [rows, setRows] = useState<IngredientRow[]>(
    existing?.extendedIngredients.map(ingredientToRow) ?? [emptyRow()]
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Import state
  const [importMode, setImportMode] = useState<"none" | "text">("none");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShare = async (recipe: CustomRecipe) => {
    const copied = await shareRecipe(recipe);
    if (copied) {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (open) {
      setIsEditing(!existing);
      setTitle(existing?.title ?? "");
      setCategory(existing?.category ?? "");
      setServings(String(existing?.servings || ""));
      setDirections(existing?.directions ?? "");
      setUrl(existing?.url ?? "");
      setEmoji(existing?.emoji ?? "");
      setRows(existing?.extendedIngredients.map(ingredientToRow) ?? [emptyRow()]);
      setShowConfirm(false);
      setImportMode("none");
      setImportText("");
      setImportError(null);
    }
  }, [open, existing]);

  function applyParsedRecipe(parsed: {
    title?: string;
    servings?: number;
    ingredients?: { text: string; aisle: string }[];
    directions?: string;
  }) {
    if (parsed.title) setTitle(parsed.title);
    if (parsed.servings) setServings(String(parsed.servings));
    if (parsed.directions) setDirections(parsed.directions);
    if (parsed.ingredients?.length) {
      setRows(parsed.ingredients.map((i) => ({ text: i.text, aisle: i.aisle || "Miscellaneous" })));
    }
    setImportMode("none");
    setImportText("");
    setImportError(null);
  }

  async function handleImportText() {
    if (!importText.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: importText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Parse failed");
      applyParsedRecipe(data);
    } catch (err) {
      console.error("[recipe import]", err);
      setImportError("Couldn't parse the recipe. Try cleaning up the text and trying again.");
    } finally {
      setImporting(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so same file can be selected again
    e.target.value = "";
    setImporting(true);
    setImportError(null);
    try {
      const { base64, mimeType } = await resizeImageToBase64(file);
      const res = await fetch("/api/recipes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Parse failed");
      applyParsedRecipe(data);
    } catch (err) {
      console.error("[recipe import]", err);
      setImportError("Couldn't read the recipe from that image. Try a clearer photo.");
    } finally {
      setImporting(false);
    }
  }

  function isDirty() {
    if (!isEditing) return false;
    if (existing) {
      const origRows = existing.extendedIngredients.map(ingredientToRow);
      return (
        title !== existing.title ||
        category !== (existing.category ?? "") ||
        servings !== String(existing.servings || "") ||
        directions !== (existing.directions ?? "") ||
        url !== (existing.url ?? "") ||
        emoji !== (existing.emoji ?? "") ||
        rows.length !== origRows.length ||
        rows.some((r, i) => {
          const orig = origRows[i];
          return !orig || r.text !== orig.text || r.aisle !== orig.aisle;
        })
      );
    }
    return (
      title.trim() !== "" ||
      directions.trim() !== "" ||
      url.trim() !== "" ||
      rows.some((r) => r.text.trim() !== "")
    );
  }

  function handleClose() {
    if (isDirty()) {
      setShowConfirm(true);
    } else {
      onClose();
    }
  }

  const updateRow = (idx: number, field: keyof IngredientRow, value: string) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!title.trim()) return;

    const extendedIngredients: ExtendedIngredient[] = rows
      .filter((r) => r.text.trim())
      .map((r, idx) => {
        const parsed = parseIngredientText(r.text);
        return {
          id: idx,
          name: parsed.name,
          nameClean: parsed.name.toLowerCase(),
          original: parsed.original,
          amount: parsed.amount,
          amountDisplay: parsed.amountDisplay || undefined,
          unit: parsed.unit,
          aisle: r.aisle,
        };
      });

    const recipe: CustomRecipe = {
      id: existing?.id ?? `custom_${crypto.randomUUID()}`,
      title: title.trim(),
      servings: parseInt(servings) || 0,
      extendedIngredients,
      directions: directions.trim() || undefined,
      url: url.trim() || undefined,
      category: category || undefined,
      emoji: emoji.trim() || undefined,
    };

    dispatch({
      type: existing ? "UPDATE_CUSTOM_RECIPE" : "ADD_CUSTOM_RECIPE",
      recipe,
    });
    setShowConfirm(false);
    onClose();
  };

  // ── View mode ────────────────────────────────────────────────────────────────
  if (!isEditing && existing) {
    return (
      <BottomSheet open={open} onClose={onClose} title={existing.title}>
        <div className="p-4 space-y-4 pb-8">
          {existing.servings > 0 && (
            <p className="text-sm text-gray-500">{existing.servings} servings</p>
          )}
          {existing.extendedIngredients.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Ingredients
              </p>
              <ul className="space-y-1">
                {existing.extendedIngredients.map((ing, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400 flex-shrink-0">·</span>
                    <span>{ing.original}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {existing.directions && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Directions
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{existing.directions}</p>
            </div>
          )}
          {existing.url && (
            <a
              href={existing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              View full recipe
            </a>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => handleShare(existing)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Share2 size={15} />
              {shareCopied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 text-white text-sm font-semibold active:bg-brand-600"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>
        </div>
      </BottomSheet>
    );
  }

  // ── Edit mode ────────────────────────────────────────────────────────────────
  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      title={existing ? "Edit Recipe" : "New Custom Recipe"}
    >
      {/* Loading overlay while AI parses */}
      {importing && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/80 rounded-t-2xl gap-3">
          <Loader2 size={32} className="animate-spin text-brand-500" />
          <p className="text-sm text-gray-600 font-medium">Reading recipe…</p>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/20 rounded-t-2xl">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-3 shadow-xl">
            <p className="text-base font-semibold text-gray-800">Discard changes?</p>
            <p className="text-sm text-gray-500">Your unsaved changes will be lost.</p>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-red-500 text-white font-semibold text-sm active:bg-red-600"
            >
              Discard
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="w-full py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm active:bg-gray-50"
            >
              Keep Editing
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-4 pb-8">

        {/* ── Import section (new recipes only) ── */}
        {!existing && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 p-3 space-y-3">
            <p className="text-xs font-semibold text-brand-700 uppercase tracking-wide">
              Import a recipe
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setImportMode(importMode === "text" ? "none" : "text")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-200 bg-white text-sm text-brand-700 font-medium hover:bg-brand-50 active:bg-brand-100"
              >
                <ClipboardPaste size={15} />
                Paste text
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-brand-200 bg-white text-sm text-brand-700 font-medium hover:bg-brand-50 active:bg-brand-100"
              >
                <Camera size={15} />
                Snap a photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {importMode === "text" && (
              <div className="space-y-2">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Paste recipe text here — ingredients, directions, anything you have…"
                  rows={5}
                  className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                />
                <button
                  onClick={handleImportText}
                  disabled={!importText.trim()}
                  className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold disabled:opacity-40 active:bg-brand-600"
                >
                  Import
                </button>
              </div>
            )}

            {importError && (
              <p className="text-xs text-red-500">{importError}</p>
            )}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Recipe Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mom's Lasagna"
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Category + Emoji */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Auto-detect from title</option>
              {CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="w-20">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Emoji
            </label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder={getRecipeEmoji(title, category)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-xl text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        {/* Servings */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Servings
          </label>
          <input
            type="number"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            min={1}
            className="mt-1 w-24 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Ingredients */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Ingredients
          </label>
          <div className="mt-2 space-y-2">
            {rows.map((row, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={row.text}
                  onChange={(e) => updateRow(idx, "text", e.target.value)}
                  placeholder="e.g. 2 cups flour"
                  className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <select
                  value={row.aisle}
                  onChange={(e) => updateRow(idx, "aisle", e.target.value)}
                  className="w-28 rounded-xl border border-gray-200 px-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                >
                  {AISLES.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeRow(idx)}
                  className="p-2 text-gray-400 hover:text-red-400 flex-shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <button
              onClick={addRow}
              className="flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 py-1"
            >
              <Plus size={16} />
              Add ingredient
            </button>
          </div>
        </div>

        {/* Directions */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Directions
          </label>
          <textarea
            value={directions}
            onChange={(e) => setDirections(e.target.value)}
            placeholder={"Step 1: Preheat oven to 375°F\nStep 2: ..."}
            rows={5}
            className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
          />
        </div>

        {/* Link */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Link (optional)
          </label>
          {url.trim() ? (
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3">
              <a
                href={url.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-brand-500 underline truncate"
              >
                {url.trim()}
              </a>
              <button
                onClick={() => setUrl("")}
                className="text-gray-500 hover:text-gray-600 flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          )}
        </div>

        {/* Save + Share */}
        <div className="flex gap-3">
          {existing && (
            <button
              onClick={() =>
                handleShare({ ...existing, title, category, emoji: emoji || undefined })
              }
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100"
            >
              <Share2 size={16} />
              {shareCopied ? "Copied!" : "Share"}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="flex-1 py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
          >
            {existing ? "Save Changes" : "Create Recipe"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
