"use client";

import { useState, useCallback } from "react";
import { Loader2, Heart, BookOpen } from "lucide-react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";
import type { DayEntry, RecipeSummary } from "@/types"; // RecipeSummary used by favorites
import { useAppContext } from "@/store/context";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";

interface AddEntrySheetProps {
  open: boolean;
  onClose: () => void;
  dateStr: string;
  dateLabel: string;
}

type Tab = "my-recipes" | "favorites" | "text";

export default function AddEntrySheet({
  open,
  onClose,
  dateStr,
  dateLabel,
}: AddEntrySheetProps) {
  const { addDayEntry, state } = useAppContext();
  const [tab, setTab] = useState<Tab>("my-recipes");
  const [textEntry, setTextEntry] = useState("");
  const [urlEntry, setUrlEntry] = useState("");
  const [favRecipes, setFavRecipes] = useState<RecipeSummary[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  const addRecipe = useCallback(
    (recipe: RecipeSummary) => {
      const entry: DayEntry = {
        id: crypto.randomUUID(),
        type: "recipe",
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.image || `/api/recipes/${recipe.id}/image`,
        recipeUrl: recipe.sourceUrl,
      };
      addDayEntry(dateStr, entry);
      onClose();
    },
    [addDayEntry, dateStr, onClose]
  );

  const addCustomRecipe = useCallback(
    (cr: { id: string; title: string }) => {
      const entry: DayEntry = {
        id: crypto.randomUUID(),
        type: "custom-recipe",
        customRecipeId: cr.id,
        recipeTitle: cr.title,
      };
      addDayEntry(dateStr, entry);
      onClose();
    },
    [addDayEntry, dateStr, onClose]
  );

  const addTextEntry = useCallback(() => {
    if (!textEntry.trim()) return;
    const entry: DayEntry = {
      id: crypto.randomUUID(),
      type: "text",
      text: textEntry.trim(),
      url: urlEntry.trim() || undefined,
    };
    addDayEntry(dateStr, entry);
    setTextEntry("");
    setUrlEntry("");
    onClose();
  }, [addDayEntry, dateStr, textEntry, urlEntry, onClose]);

  const loadFavorites = useCallback(async () => {
    if (state.favorites.length === 0) { setFavRecipes([]); return; }
    setFavLoading(true);
    try {
      const recipes = await Promise.all(
        state.favorites.map((id) => fetch(`/api/recipes/${id}`).then((r) => r.json()))
      );
      setFavRecipes(recipes);
    } catch {
      setFavRecipes([]);
    } finally {
      setFavLoading(false);
    }
  }, [state.favorites]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "favorites") loadFavorites();
  };

  const handleClose = () => {
    setTextEntry("");
    setUrlEntry("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title={`Add to ${dateLabel}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-4 pt-2">
        {(["my-recipes", "favorites", "text"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "my-recipes" && <BookOpen size={15} />}
            {t === "favorites" && <Heart size={15} />}
            {t === "text" && <span className="text-sm leading-none">📝</span>}
            {t === "my-recipes" ? "My Recipes" : t === "favorites" ? "Favorites" : "Note"}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "my-recipes" && (
          <div>
            {state.customRecipes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No custom recipes yet — add them on the Recipes tab</p>
            ) : (
              Object.entries(
                state.customRecipes.reduce<Record<string, { emoji: string; recipes: typeof state.customRecipes }>>((groups, cr) => {
                  const { emoji, label } = getRecipeCategory(cr.title);
                  if (!groups[label]) groups[label] = { emoji, recipes: [] };
                  groups[label].recipes.push(cr);
                  groups[label].recipes.sort((a, b) => a.title.localeCompare(b.title));
                  return groups;
                }, {})
              )
                .sort(([a], [b]) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))
                .map(([label, { emoji, recipes }]) => (
                  <div key={label} className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1">{emoji} {label}</p>
                    {recipes.map((cr) => (
                      <button
                        key={cr.id}
                        onClick={() => addCustomRecipe(cr)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 active:bg-brand-100"
                      >
                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                          {getRecipeEmoji(cr.title)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{cr.title}</span>
                      </button>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {tab === "favorites" && (
          <div className="space-y-1">
            {favLoading && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-500" />
              </div>
            )}
            {!favLoading && favRecipes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No favorites yet — heart a recipe on the Discover tab</p>
            )}
            {!favLoading && favRecipes.map((recipe) => (
              <button
                key={recipe.id}
                onClick={() => addRecipe(recipe)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 active:bg-brand-100"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                  {recipe.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{recipe.title}</p>
                  {recipe.readyInMinutes > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">{recipe.readyInMinutes} min</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Add a note like &quot;Takeout&quot;, &quot;Grandma&apos;s coming over&quot;, or &quot;Date night&quot;
            </p>
            <input
              type="text"
              value={textEntry}
              onChange={(e) => setTextEntry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTextEntry()}
              placeholder="e.g. Easter Brunch"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
            />
            <input
              type="url"
              value={urlEntry}
              onChange={(e) => setUrlEntry(e.target.value)}
              placeholder="Link (optional)"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              onClick={addTextEntry}
              disabled={!textEntry.trim()}
              className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-brand-600"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
