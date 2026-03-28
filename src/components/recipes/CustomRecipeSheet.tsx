"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, X } from "lucide-react";
import BottomSheet from "@/components/shared/BottomSheet";
import { useAppContext } from "@/store/context";
import { CATEGORIES } from "@/lib/recipe-emoji";
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
  name: string;
  amount: string;
  unit: string;
  aisle: string;
}

const emptyRow = (): IngredientRow => ({
  name: "",
  amount: "",
  unit: "",
  aisle: "Miscellaneous",
});

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
  const [title, setTitle] = useState(existing?.title ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [servings, setServings] = useState(String(existing?.servings || ""));
  const [directions, setDirections] = useState(existing?.directions ?? "");
  const [url, setUrl] = useState(existing?.url ?? "");
  const [rows, setRows] = useState<IngredientRow[]>(
    existing?.extendedIngredients.map((i) => ({
      name: i.name,
      amount: String(i.amount),
      unit: i.unit,
      aisle: i.aisle,
    })) ?? [emptyRow()]
  );

  useEffect(() => {
    if (open) {
      setTitle(existing?.title ?? "");
      setCategory(existing?.category ?? "");
      setServings(String(existing?.servings || ""));
      setDirections(existing?.directions ?? "");
      setUrl(existing?.url ?? "");
      setRows(
        existing?.extendedIngredients.map((i) => ({
          name: i.name,
          amount: String(i.amount),
          unit: i.unit,
          aisle: i.aisle,
        })) ?? [emptyRow()]
      );
    }
  }, [open, existing]);

  const updateRow = (idx: number, field: keyof IngredientRow, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (idx: number) =>
    setRows((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = () => {
    if (!title.trim()) return;

    const extendedIngredients: ExtendedIngredient[] = rows
      .filter((r) => r.name.trim())
      .map((r, idx) => ({
        id: idx,
        name: r.name.trim(),
        nameClean: r.name.trim().toLowerCase(),
        original: `${r.amount} ${r.unit} ${r.name}`.trim(),
        amount: parseFloat(r.amount) || 0,
        unit: r.unit.trim(),
        aisle: r.aisle,
      }));

    const recipe: CustomRecipe = {
      id: existing?.id ?? `custom_${crypto.randomUUID()}`,
      title: title.trim(),
      servings: parseInt(servings) || 0,
      extendedIngredients,
      directions: directions.trim() || undefined,
      url: url.trim() || undefined,
      category: category || undefined,
    };

    dispatch({
      type: existing ? "UPDATE_CUSTOM_RECIPE" : "ADD_CUSTOM_RECIPE",
      recipe,
    });
    onClose();
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={existing ? "Edit Recipe" : "New Custom Recipe"}
    >
      <div className="p-4 space-y-4 pb-8">
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

        {/* Category */}
        <div>
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
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(idx, "name", e.target.value)}
                    placeholder="Ingredient"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={row.amount}
                      onChange={(e) => updateRow(idx, "amount", e.target.value)}
                      placeholder="Amt"
                      className="w-16 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <input
                      type="text"
                      value={row.unit}
                      onChange={(e) => updateRow(idx, "unit", e.target.value)}
                      placeholder="Unit"
                      className="w-20 rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <select
                      value={row.aisle}
                      onChange={(e) => updateRow(idx, "aisle", e.target.value)}
                      className="flex-1 rounded-xl border border-gray-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
                    >
                      {AISLES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => removeRow(idx)}
                  className="mt-2 p-2 text-gray-400 hover:text-red-400 active:text-red-500"
                >
                  <Trash2 size={16} />
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
            placeholder="Step 1: Preheat oven to 375°F&#10;Step 2: ..."
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
              <button onClick={() => setUrl("")} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
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

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className="w-full py-3.5 bg-brand-500 text-white rounded-xl font-semibold text-sm disabled:opacity-40 active:bg-brand-600"
        >
          {existing ? "Save Changes" : "Create Recipe"}
        </button>
      </div>
    </BottomSheet>
  );
}
