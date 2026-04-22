"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, Heart, BookOpen, Plus, Search, X, LayoutTemplate, ChevronRight } from "lucide-react";
import clsx from "clsx";
import BottomSheet from "@/components/shared/BottomSheet";
import type { DayEntry, RecipeSummary, CustomRecipe, SavedMenu } from "@/types";
import TemplatePreviewSheet from "@/components/menu/TemplatePreviewSheet";
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

type Tab = "my-recipes" | "favorites" | "templates";
type QuickAdd = "note" | "headline" | null;

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
  const [quickAdd, setQuickAdd] = useState<QuickAdd>(null);
  const [query, setQuery] = useState("");
  const [textEntry, setTextEntry] = useState("");
  const [favRecipes, setFavRecipes] = useState<RecipeSummary[]>([]);
  const [favLoading, setFavLoading] = useState(false);
  const [viewingCustomRecipe, setViewingCustomRecipe] = useState<CustomRecipe | null>(null);
  const [viewingFavRecipe, setViewingFavRecipe] = useState<RecipeSummary | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<SavedMenu | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const addNoteEntry = useCallback(() => {
    if (!textEntry.trim()) return;
    doAdd({
      id: crypto.randomUUID(),
      type: "text",
      text: textEntry.trim(),
    });
    setTextEntry("");
    setQuickAdd(null);
  }, [doAdd, textEntry]);

  const addHeadlineEntry = useCallback(() => {
    if (!textEntry.trim()) return;
    doAdd({
      id: crypto.randomUUID(),
      type: "event",
      text: textEntry.trim(),
    });
    setTextEntry("");
    setQuickAdd(null);
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

  // Load favorites eagerly when sheet opens so combined search works immediately
  useEffect(() => {
    if (open) loadFavorites();
  }, [open, loadFavorites]);

  // Focus textarea when quick-add panel opens
  useEffect(() => {
    if (quickAdd) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [quickAdd]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setQuery("");
    setTextEntry("");
    setQuickAdd(null);
  };

  const handleQuickAdd = (type: NonNullable<QuickAdd>) => {
    if (quickAdd === type) {
      setQuickAdd(null);
      setTextEntry("");
    } else {
      setQuickAdd(type);
      setTextEntry("");
    }
  };

  const handleClose = () => {
    setQuery("");
    setTextEntry("");
    setQuickAdd(null);
    onClose();
  };

  return (
    <>
    <BottomSheet open={open} onClose={handleClose} title={`Add to ${dateLabel}`}>

      {/* Search bar — visible on My Recipes + Favorites tabs when no quick-add is open */}
      {(tab === "my-recipes" || tab === "favorites") && !quickAdd && (
        <div className="px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all recipes…"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary tabs */}
      <div className="flex border-b border-gray-200 px-2 pt-2">
        {(["my-recipes", "favorites", "templates"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 px-1 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "my-recipes" && <BookOpen size={14} />}
            {t === "favorites" && <Heart size={14} className="text-red-400" />}
            {t === "templates" && <LayoutTemplate size={14} />}
            {t === "my-recipes" ? "My Recipes" : t === "favorites" ? "Favorites" : "Templates"}
          </button>
        ))}
      </div>

      {/* Quick-add action buttons */}
      <div className="flex gap-2 px-4 py-2.5 border-b border-gray-100">
        <button
          onClick={() => handleQuickAdd("note")}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            quickAdd === "note"
              ? "bg-brand-100 text-brand-700 ring-1 ring-brand-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <span className="text-sm leading-none">📝</span> Note
        </button>
        <button
          onClick={() => handleQuickAdd("headline")}
          className={clsx(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            quickAdd === "headline"
              ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          <span className="text-sm leading-none">📌</span> Headline
        </button>
      </div>

      <div className="p-4 h-60 overflow-y-auto">

        {/* Quick-add: Note form */}
        {quickAdd === "note" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Add a note like &quot;Takeout&quot;, &quot;Grandma&apos;s coming over&quot;, or &quot;Date night&quot;
            </p>
            <textarea
              ref={textareaRef}
              value={textEntry}
              onChange={(e) => setTextEntry(e.target.value)}
              placeholder="e.g. Easter Brunch"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setQuickAdd(null); setTextEntry(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addNoteEntry}
                disabled={!textEntry.trim()}
                className="flex-1 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-brand-600"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Quick-add: Headline form */}
        {quickAdd === "headline" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Headline pins to the top of the day — great for occasions or themes. Emojis welcome!
            </p>
            <textarea
              ref={textareaRef}
              value={textEntry}
              onChange={(e) => setTextEntry(e.target.value)}
              placeholder="e.g. 🎂 Elizabeth's Birthday"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setQuickAdd(null); setTextEntry(""); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={addHeadlineEntry}
                disabled={!textEntry.trim()}
                className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:bg-indigo-600"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Combined search results — shown on My Recipes or Favorites tab when querying */}
        {!quickAdd && (tab === "my-recipes" || tab === "favorites") && query.trim() && (() => {
          const q = query.toLowerCase();
          const matchedCustom = state.customRecipes.filter((cr) => cr.title.toLowerCase().includes(q));
          const matchedFavs = favRecipes.filter((r) => r.title.toLowerCase().includes(q));
          if (matchedCustom.length === 0 && matchedFavs.length === 0) {
            return <p className="text-sm text-gray-500 text-center py-8">No matches found</p>;
          }
          return (
            <div className="space-y-4">
              {matchedCustom.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                    <BookOpen size={12} /> My Recipes
                    <span className="font-normal normal-case tracking-normal text-gray-400">({matchedCustom.length})</span>
                  </p>
                  {matchedCustom.map((cr) => (
                    <div key={cr.id} className="flex items-center gap-2 rounded-xl hover:bg-brand-50 active:bg-brand-100">
                      <button onClick={() => setViewingCustomRecipe(cr)} className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                          {getRecipeEmoji(cr.title, cr.category, cr.emoji)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 truncate">{cr.title}</span>
                      </button>
                      <button onClick={() => addCustomRecipe(cr)} className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100" aria-label="Add to day">
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {matchedFavs.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest px-1 mb-2">
                    <Heart size={12} className="text-red-400" /> Favorites
                    <span className="font-normal normal-case tracking-normal text-gray-400">({matchedFavs.length})</span>
                  </p>
                  {matchedFavs.map((recipe) => (
                    <div key={recipe.id} className="flex items-center gap-2 rounded-xl hover:bg-brand-50 active:bg-brand-100">
                      <button onClick={() => setViewingFavRecipe(recipe)} className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          {recipe.image && <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{recipe.title}</p>
                          {recipe.readyInMinutes > 0 && <p className="text-xs text-gray-500 mt-0.5">{recipe.readyInMinutes} min</p>}
                        </div>
                      </button>
                      <button onClick={() => addRecipe(recipe)} className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100" aria-label="Add to day">
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* My Recipes tab */}
        {!quickAdd && tab === "my-recipes" && !query.trim() && (
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
                        <button onClick={() => setViewingCustomRecipe(cr)} className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left">
                          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                            {getRecipeEmoji(cr.title, cr.category, cr.emoji)}
                          </div>
                          <span className="text-sm font-medium text-gray-800">{cr.title}</span>
                        </button>
                        <button onClick={() => addCustomRecipe(cr)} className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100" aria-label="Add to day">
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Favorites tab */}
        {!quickAdd && tab === "favorites" && !query.trim() && (
          <div>
            {favLoading && (
              <div className="flex justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gray-500" />
              </div>
            )}
            {!favLoading && favRecipes.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">No favorites yet — heart a recipe on the Discover tab</p>
            )}
            {!favLoading && favRecipes.length > 0 && (
              Object.entries(
                favRecipes.reduce<Record<string, { emoji: string; recipes: typeof favRecipes }>>((groups, recipe) => {
                  const { emoji, label } = getRecipeCategory(recipe.title);
                  if (!groups[label]) groups[label] = { emoji, recipes: [] };
                  groups[label].recipes.push(recipe);
                  groups[label].recipes.sort((a, b) => a.title.localeCompare(b.title));
                  return groups;
                }, {})
              )
                .sort(([a], [b]) => a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b))
                .map(([label, { emoji, recipes }]) => (
                  <div key={label} className="mb-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-1">{emoji} {label}</p>
                    {recipes.map((recipe) => (
                      <div key={recipe.id} className="flex items-center gap-2 rounded-xl hover:bg-brand-50 active:bg-brand-100">
                        <button onClick={() => setViewingFavRecipe(recipe)} className="flex items-center gap-3 flex-1 min-w-0 p-3 text-left">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center">
                            {recipe.image
                              ? <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" /> // eslint-disable-line @next/next/no-img-element
                              : <span className="text-lg">{getRecipeEmoji(recipe.title)}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 leading-tight line-clamp-2">{recipe.title}</p>
                            {recipe.readyInMinutes > 0 && <p className="text-xs text-gray-500 mt-0.5">{recipe.readyInMinutes} min</p>}
                          </div>
                        </button>
                        <button onClick={() => addRecipe(recipe)} className="flex-shrink-0 p-2 mr-1 rounded-xl text-brand-500 hover:bg-brand-100" aria-label="Add to day">
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))
            )}
          </div>
        )}

        {/* Templates tab */}
        {!quickAdd && tab === "templates" && (
          <div>
            {state.savedMenus.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                <LayoutTemplate size={32} className="text-gray-300" />
                <p className="text-sm font-medium text-gray-500">No templates yet</p>
                <p className="text-xs text-gray-400">Create one in Event Planning — bookmark a day or tap&nbsp;&ldquo;New Template&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-1">
                {state.savedMenus.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setPreviewTemplate(t)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-brand-50 active:bg-brand-100 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <LayoutTemplate size={16} className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.entries.length} item{t.entries.length !== 1 ? "s" : ""}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </BottomSheet>

    <CustomRecipeSheet
      open={!!viewingCustomRecipe}
      onClose={() => setViewingCustomRecipe(null)}
      existing={viewingCustomRecipe ?? undefined}
    />

    <RecipeDetailSheet
      recipe={viewingFavRecipe}
      onClose={() => setViewingFavRecipe(null)}
    />

    <TemplatePreviewSheet
      open={!!previewTemplate}
      onClose={() => setPreviewTemplate(null)}
      template={previewTemplate}
      dateStr={dateStr}
      dateLabel={dateLabel}
      onAddEntry={onAddEntry}
      onStamped={handleClose}
    />
    </>
  );
}
