"use client";

import { useState, useCallback } from "react";
import { Loader2, Heart, BookOpen, Plus } from "lucide-react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";
import type { DayEntry, RecipeSummary, CustomRecipe } from "@/types";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import RecipeDetailSheet from "@/components/recipes/RecipeDetailSheet";

interface AddEntrySheetProps {
  open: boolean;
  onClose: () => void;
  dateStr: string;
  dateLabel: string;
  /** When provided, entries are sent here instead of added to the day */
  onAddEntry?: (entry: DayEntry) => void;
}

type Tab = "my-recipes" | "favorites" | "event" | "text";

export default function AddEntrySheet({
  open,
  onClose,
  dateStr,
  dateLabel,
  onAddEntry,
}: AddEntrySheetProps) {
  const { addDayEntry, state } = useAppContext();

  const doAdd = useCallback(
    (entry: DayEntry) => {
      if (onAddEntry) {
        onAddEntry(entry);
      } else {
        addDayEntry(dateStr, entry);
      }
      onClose();
    },
    [onAddEntry, addDayEntry, dateStr, onClose]
  );
  const [tab, setTab] = useState<Tab>("my-recipes");
  const [textEntry, setTextEntry] = useState("");
  const [urlEntry, setUrlEntry] = useState("");
  const [favRecipes, setFavRecipes] = useState<RecipeSummary[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [viewingCustomRecipe, setViewingCustomRecipe] = useState<CustomRecipe | null>(null);
  const [viewingFavRecipe, setViewingFavRecipe] = useState<RecipeSummary | null>(null);

  const addRecipe = useCallback(
    (recipe: RecipeSummary) => {
      doAdd({
        id: crypto.randomUUID(),
        type: "recipe",
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        recipeImage: recipe.image || `/api/recipes/${recipe.id}/image`,
        recipeUrl: recipe.sourceUrl,
      });
    },
    [doAdd]
  );

  const addCustomRecipe = useCallback(
    (cr: { id: string; title: string }) => {
      doAdd({
        id: crypto.randomUUID(),
        type: "custom-recipe",
        customRecipeId: cr.id,
        recipeTitle: cr.title,
      });
    },
    [doAdd]
  );

  const addTextEntry = useCallback(() => {
    if (!textEntry.trim()) return;
    doAdd({
      id: crypto.randomUUID(),
      type: "text",
      text: textEntry.trim(),
      url: urlEntry.trim() || undefined,
    });
    setTextEntry("");
    setUrlEntry("");
  }, [doAdd, textEntry, urlEntry]);

  const addEventEntry = useCallback(() => {
    if (!textEntry.trim()) return;
    doAdd({
      id: crypto.randomUUID(),
      type: "event",
      text: textEntry.trim(),
    });
    setTextEntry("");
  }, [doAdd, textEntry]);

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
    setTextEntry("");
    setUrlEntry("");
    if (t === "favorites") loadFavorites();
  };

  const handleClose = () => {
    setTextEntry("");
    setUrlEntry("");
    onClose();
  };

  return (
    <>
    <BottomSheet open={open} onClose={handleClose} title={`Add to ${dateLabel}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-2 pt-2">
        {(["my-recipes", "favorites", "text", "event"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1 px-1 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "my-recipes" && <BookOpen size={14} />}
            {t === "favorites" && <Heart size={14} className="text-red-400" />}
            {t === "event" && <span className="text-sm leading-none">🎉</span>}
            {t === "text" && <span className="text-sm leading-none">📝</span>}
            {t === "my-recipes" ? "My Recipes" : t === "favorites" ? "Favorites" : t === "event" ? "Event" : "Note"}
          </button>
        ))}
      </div>

      <div className="p-4 h-72 overflow-y-auto">
        {tab === "my-recipes" && (
          <div>
            {state.customRecipes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No custom recipes yet — add them on the Recipes tab</p>
            ) : (
              Object.entries(
                state.customRecipes.reduce<Record<string, { emoji: string; recipes: typeof state.customRecipes }>>((groups, cr) => {
                  const { emoji, label } = getRecipeCategory(cr.title, cr.category);
                  if (!groups[label]) groups[label] = { emoji, recipes: [] };
                  groups[label].recipes.push(cr);
                  groups[label].recipes.sort((a, b) => a.title.localeCompare(b.title));
                  return groups;
                }, {})
              )
                .sort(([a], [b]) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))
                .map(([label, { emoji, recipes }]) => (
                  <div key={label} className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">{emoji} {label}</p>
                    {recipes.map((cr) => (
                      <div key={cr.id} className="flex items-center gap-2 rounded-xl hover:bg-brand-50 active:bg-brand-100">
                        <button
                          onClick={() => setViewingCustomRecipe(cr)}
                          className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left"
                        >
                          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                            {getRecipeEmoji(cr.title)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{cr.title}</span>
                        </button>
                        <button
                          onClick={() => addCustomRecipe(cr)}
                          className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100"
                          aria-label="Add to day"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
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
              <div key={recipe.id} className="flex items-center gap-2 rounded-xl hover:bg-brand-50 active:bg-brand-100">
                <button
                  onClick={() => setViewingFavRecipe(recipe)}
                  className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left"
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
                <button
                  onClick={() => addRecipe(recipe)}
                  className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100"
                  aria-label="Add to day"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

{tab === "event" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Mark a special occasion — use emojis to make it pop!
            </p>
            <input
              type="text"
              value={textEntry}
              onChange={(e) => setTextEntry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEventEntry()}
              placeholder="e.g. 🎂 Elizabeth's Birthday"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              autoFocus
            />
            {textEntry.trim() && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm font-semibold text-amber-800">
                {textEntry}
              </div>
            )}
            <button
              onClick={addEventEntry}
              disabled={!textEntry.trim()}
              className="w-full py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-brand-600"
            >
              Add Event
            </button>
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

    <CustomRecipeSheet
      open={!!viewingCustomRecipe}
      onClose={() => setViewingCustomRecipe(null)}
      existing={viewingCustomRecipe ?? undefined}
      readOnly
    />

    <RecipeDetailSheet
      recipe={viewingFavRecipe}
      onClose={() => setViewingFavRecipe(null)}
    />
    </>
  );
}
