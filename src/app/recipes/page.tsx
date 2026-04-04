"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Plus, Heart, BookOpen, Trash2, Loader2, Bookmark, ChevronRight, Pencil, Check, ChevronsDown, ScrollText, Lightbulb } from "lucide-react";
import clsx from "clsx";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import RecipeDetailSheet from "@/components/recipes/RecipeDetailSheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import TipSheet from "@/components/recipes/TipSheet";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import AddEntrySheet from "@/components/menu/AddEntrySheet";
import SaveMenuSheet from "@/components/menu/SaveMenuSheet";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";
import type { RecipeSummary, CustomRecipe, DayEntry, Tip } from "@/types";

type Tab = "discover" | "favorites" | "custom" | "menus" | "tips";

const TIP_CATEGORY_EMOJI: Record<string, string> = {
  Technique: "🔪",
  Timing: "⏱️",
  Substitution: "🔄",
  Storage: "📦",
  General: "💡",
};

export default function RecipesPage() {
  const { state, dispatch } = useAppContext();
  const [tab, setTab] = useState<Tab>("discover");

  // Discover state
  const [query, setQuery] = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterDish, setFilterDish] = useState("");
  const [filterDiet, setFilterDiet] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsFromGenerate, setResultsFromGenerate] = useState(false);

  // Favorites state
  const [favRecipes, setFavRecipes] = useState<RecipeSummary[]>([]);
  const [favLoading, setFavLoading] = useState(false);

  // Custom sheet
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<CustomRecipe | undefined>();

  // Day picker for custom recipes
  const [dayPickerRecipe, setDayPickerRecipe] = useState<RecipeSummary | null>(null);

  // My Menus state
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [pickerEntry, setPickerEntry] = useState<DayEntry | null>(null);
  const [addAllMenuId, setAddAllMenuId] = useState<string | null>(null);
  const [addingToMenuId, setAddingToMenuId] = useState<string | null>(null);
  const [renamingMenuId, setRenamingMenuId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [viewingMenuRecipe, setViewingMenuRecipe] = useState<RecipeSummary | null>(null);
  const [viewingMenuCustom, setViewingMenuCustom] = useState<CustomRecipe | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: "recipe" | "menu"; name: string } | null>(null);

  // Tips state
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | undefined>();
  const [confirmDeleteTip, setConfirmDeleteTip] = useState<{ id: string; title: string } | null>(null);

  const handleSearch = useCallback(async (token?: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ query, number: "10" });
      if (token) params.set("nextPageToken", token);
      if (filterCuisine) params.set("cuisine", filterCuisine);
      if (filterDish) params.set("type", filterDish);
      if (filterDiet) params.set("diet", filterDiet);
      const res = await fetch(`/api/recipes/search?${params}`);
      const data = await res.json();
      if (token) {
        setResults((prev) => [...prev, ...(data.results ?? [])]);
      } else {
        setResults(data.results ?? []);
      }
      setNextPageToken(data.nextPageToken);
    } catch {
      if (!token) setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, filterCuisine, filterDish, filterDiet]);

  useEffect(() => {
    if (!hasSearched || !query.trim()) return;
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCuisine, filterDish, filterDiet]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setResultsFromGenerate(true);
    setQuery("");
    setFilterCuisine("");
    setFilterDish("");
    setFilterDiet("");
    try {
      const disliked = state.dislikedRecipes.join(",");
      const res = await fetch(
        `/api/recipes/generate${disliked ? `?disliked=${disliked}` : ""}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
      setNextPageToken(undefined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [state.dislikedRecipes]);

  const loadFavorites = useCallback(async () => {
    if (state.favorites.length === 0) {
      setFavRecipes([]);
      return;
    }
    setFavLoading(true);
    try {
      const recipes = await Promise.all(
        state.favorites.map((id) =>
          fetch(`/api/recipes/${id}`).then((r) => r.json())
        )
      );
      setFavRecipes(recipes.filter((r) => r?.id));
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

  const handleViewMenuEntry = (entry: DayEntry) => {
    if (entry.type === "recipe" && entry.recipeId) {
      setViewingMenuRecipe({
        id: entry.recipeId,
        title: entry.recipeTitle ?? "",
        image: entry.recipeImage ?? "",
        readyInMinutes: 0,
        servings: 0,
        sourceUrl: entry.recipeUrl,
      });
    } else if (entry.type === "custom-recipe" && entry.customRecipeId) {
      const cr = state.customRecipes.find((r) => r.id === entry.customRecipeId);
      if (cr) setViewingMenuCustom(cr);
    } else if (entry.type === "text" && entry.url) {
      window.open(entry.url, "_blank", "noopener,noreferrer");
    }
  };

  const customToSummary = (cr: CustomRecipe): RecipeSummary => ({
    id: cr.id,
    title: cr.title,
    image: "",
    readyInMinutes: 0,
    servings: cr.servings,
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {(["discover", "favorites", "custom", "menus", "tips"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex-1 py-3 text-xs font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "discover" && "Discover"}
            {t === "favorites" && "Favorites"}
            {t === "custom" && "My Recipes"}
            {t === "menus" && "My Menus"}
            {t === "tips" && "Tips"}
          </button>
        ))}
      </div>

      {/* Discover Tab */}
      {tab === "discover" && (
        <div className="flex flex-col flex-1 p-4 gap-4">
          <div className="sticky top-[45px] z-20 bg-white -mx-4 px-4 pb-2 pt-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchBar
                  value={query}
                  onChange={(v) => { setQuery(v); if (v) setResultsFromGenerate(false); }}
                  onSubmit={() => handleSearch()}
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-3 bg-brand-50 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-100 active:bg-brand-200 disabled:opacity-50"
                title="Generate 10 random recipes"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}
                <span className="hidden sm:inline">Generate</span>
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto py-1 -my-1 scrollbar-none">
              <select
                value={filterCuisine}
                onChange={(e) => setFilterCuisine(e.target.value)}
                disabled={resultsFromGenerate}
                className="min-w-[120px] rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">All cuisines</option>
                {["American","Asian","British","Caribbean","Central Europe","Chinese","Eastern Europe","French","Indian","Italian","Japanese","Kosher","Mediterranean","Mexican","Middle Eastern","Nordic","South American","South East Asian"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={filterDish}
                onChange={(e) => setFilterDish(e.target.value)}
                disabled={resultsFromGenerate}
                className="min-w-[120px] rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">All dishes</option>
                {["Biscuits and cookies","Bread","Cereals","Condiments and sauces","Desserts","Drinks","Main course","Pancake","Preserve","Salad","Sandwiches","Soup","Starter","Sweets"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={filterDiet}
                onChange={(e) => setFilterDiet(e.target.value)}
                disabled={resultsFromGenerate}
                className="min-w-[120px] rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <option value="">All diets</option>
                {["balanced","high-fiber","high-protein","low-carb","low-fat","low-sodium"].map((d) => (
                  <option key={d} value={d}>{d.replace(/-/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && results.length === 0 ? (
            <LoadingSpinner className="py-16" />
          ) : results.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {results.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
              {nextPageToken && (
                <button
                  onClick={() => handleSearch(nextPageToken)}
                  disabled={loading}
                  className="w-full py-3 text-sm text-brand-500 font-medium hover:text-brand-600"
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          ) : hasSearched ? (
            <EmptyState title="No recipes found" description="Try a different search term" />
          ) : (
            <EmptyState
              icon={<BookOpen size={48} />}
              title="Find your next meal"
              description='Search for recipes or tap ✨ for inspiration'
            />
          )}
        </div>
      )}

      {/* Favorites Tab */}
      {tab === "favorites" && (
        <div className="p-4">
          {favLoading ? (
            <LoadingSpinner className="py-16" />
          ) : favRecipes.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(
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
                  <div key={label}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 pb-2">
                      {emoji} {label}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={<Heart size={48} />}
              title="No favorites yet"
              description="Tap the heart on any recipe to save it here"
            />
          )}
        </div>
      )}

      {/* Custom Recipes Tab */}
      {tab === "custom" && (
        <div className="p-4">
          <div className="sticky top-[45px] z-10 bg-white -mx-4 px-4 pb-4 pt-3">
            <button
              onClick={() => {
                setEditingRecipe(undefined);
                setCustomSheetOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-200 text-brand-500 rounded-xl text-sm font-medium hover:bg-brand-50 active:bg-brand-100"
            >
              <Plus size={18} />
              New Custom Recipe
            </button>
          </div>

          <div className="mt-4" />
          {state.customRecipes.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={48} />}
              title="No custom recipes yet"
              description="Add your own recipes with ingredients for the grocery list"
            />
          ) : (
            <div className="space-y-4">
              {Object.entries(
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
                  <div key={label}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-1 pb-2">
                      {emoji} {label}
                    </h3>
                    <div className="space-y-2">
                      {recipes.map((cr) => (
                        <div
                          key={cr.id}
                          className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3"
                        >
                          <button
                            onClick={() => { setEditingRecipe(cr); setCustomSheetOpen(true); }}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                              {getRecipeEmoji(cr.title, cr.category, cr.emoji)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{cr.title}</p>
                              {(cr.extendedIngredients.length > 0 || cr.servings > 0) && (
                                <p className="text-xs text-gray-500">
                                  {[
                                    cr.extendedIngredients.length > 0 &&
                                      `${cr.extendedIngredients.length} ingredient${cr.extendedIngredients.length !== 1 ? "s" : ""}`,
                                    cr.servings > 0 && `${cr.servings} servings`,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              )}
                            </div>
                          </button>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setDayPickerRecipe(customToSummary(cr))}
                              className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl"
                              title="Add to menu"
                            >
                              <Plus size={18} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: cr.id, type: "recipe", name: cr.title })}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-50 rounded-xl"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* My Menus Tab */}
      {tab === "menus" && (
        <div className="p-4 space-y-3">
          {/* New Menu button */}
          <button
            onClick={() => setNewMenuOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-200 text-brand-500 rounded-xl text-sm font-medium hover:bg-brand-50 active:bg-brand-100"
          >
            <Plus size={18} />
            New Menu
          </button>

          {state.savedMenus.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={48} />}
              title="No saved menus yet"
              description="Tap the bookmark icon on any day to save it, or create a new one above"
            />
          ) : (
            state.savedMenus.map((savedMenu) => (
              <div key={savedMenu.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpandedMenu(expandedMenu === savedMenu.id ? null : savedMenu.id)}
                >
                  <ScrollText size={16} className="text-brand-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renamingMenuId === savedMenu.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && renameValue.trim()) {
                              dispatch({ type: "RENAME_SAVED_MENU", id: savedMenu.id, name: renameValue.trim() });
                              setRenamingMenuId(null);
                            }
                            if (e.key === "Escape") setRenamingMenuId(null);
                          }}
                          className="flex-1 text-sm font-semibold rounded-lg border border-brand-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button
                          onClick={() => {
                            if (renameValue.trim()) {
                              dispatch({ type: "RENAME_SAVED_MENU", id: savedMenu.id, name: renameValue.trim() });
                            }
                            setRenamingMenuId(null);
                          }}
                          className="p-1 text-brand-500 hover:text-brand-700"
                        >
                          <Check size={16} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-semibold text-gray-800 truncate">{savedMenu.name}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {savedMenu.entries.length} item{savedMenu.entries.length !== 1 ? "s" : ""} · {new Date(savedMenu.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Rename */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setRenamingMenuId(savedMenu.id); setRenameValue(savedMenu.name); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                      title="Rename"
                    >
                      <Pencil size={14} />
                    </button>
                    {/* Add all to a day */}
                    {savedMenu.entries.length > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setAddAllMenuId(savedMenu.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
                        title="Add all to a day"
                      >
                        <ChevronsDown size={15} />
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete({ id: savedMenu.id, type: "menu", name: savedMenu.name });
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                    {/* Expand indicator */}
                    <div className="p-1.5">
                      <ChevronRight size={16} className={clsx("transition-transform text-gray-500", expandedMenu === savedMenu.id && "rotate-90")} />
                    </div>
                  </div>
                </div>

                {/* Entries */}
                {expandedMenu === savedMenu.id && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {savedMenu.entries.map((entry) => {
                      const canView = entry.type === "recipe" || entry.type === "custom-recipe" || (entry.type === "text" && !!entry.url);
                      return (
                        <div key={entry.id} className="flex items-center gap-2 hover:bg-brand-50 active:bg-brand-100">
                          <button
                            onClick={() => canView ? handleViewMenuEntry(entry) : undefined}
                            className="flex items-center gap-3 flex-1 min-w-0 px-4 py-3 text-left"
                          >
                            {(entry.type === "recipe" || entry.type === "custom-recipe") && entry.recipeImage ? (
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={entry.recipeImage}
                                  alt={entry.recipeTitle ?? ""}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    if (entry.recipeId) (e.target as HTMLImageElement).src = `/api/recipes/${entry.recipeId}/image`;
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                                {entry.type === "event" ? "🎉" : entry.type === "text" ? "📝" : (() => {
                                  const cr = entry.type === "custom-recipe" ? state.customRecipes.find((r) => r.id === entry.customRecipeId) : undefined;
                                  return getRecipeEmoji(entry.recipeTitle ?? "", cr?.category, cr?.emoji);
                                })()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 line-clamp-2">{entry.recipeTitle ?? entry.text ?? ""}</p>
                              <p className="text-xs text-gray-500 capitalize">{entry.type === "custom-recipe" ? "my recipe" : entry.type}</p>
                            </div>
                          </button>
                          <button
                            onClick={() => setPickerEntry(entry)}
                            className="flex-shrink-0 p-2 mr-2 rounded-xl text-brand-500 hover:bg-brand-100"
                            aria-label="Add to day"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      );
                    })}
                    {/* Add items to this saved menu */}
                    <button
                      onClick={() => setAddingToMenuId(savedMenu.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-brand-500 hover:bg-brand-50 active:bg-brand-100"
                    >
                      <Plus size={15} />
                      Add items
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tips Tab */}
      {tab === "tips" && (
        <div className="p-4">
          <div className="sticky top-[45px] z-10 bg-white -mx-4 px-4 pb-4 pt-3">
            <button
              onClick={() => { setEditingTip(undefined); setTipSheetOpen(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-200 text-brand-500 rounded-xl text-sm font-medium hover:bg-brand-50 active:bg-brand-100"
            >
              <Plus size={18} />
              New Tip
            </button>
          </div>

          {state.tips.length === 0 ? (
            <EmptyState
              icon={<Lightbulb size={48} />}
              title="No tips yet"
              description="Save cooking tips you look up often — techniques, timing, substitutions"
            />
          ) : (
            <div className="space-y-2">
              {[...state.tips].sort((a, b) => a.title.localeCompare(b.title)).map((tip) => (
                <div
                  key={tip.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                    {TIP_CATEGORY_EMOJI[tip.category ?? ""] ?? "💡"}
                  </div>
                  <button
                    onClick={() => { setEditingTip(tip); setTipSheetOpen(true); }}
                    className="flex-1 min-w-0 text-left"
                  >
                    <p className="text-sm font-semibold text-gray-800">{tip.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{tip.body}</p>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteTip({ id: tip.id, title: tip.title })}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-xl flex-shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CustomRecipeSheet
        open={customSheetOpen}
        onClose={() => setCustomSheetOpen(false)}
        existing={editingRecipe}
      />

      {dayPickerRecipe && (
        <DayPickerSheet
          open={!!dayPickerRecipe}
          onClose={() => setDayPickerRecipe(null)}
          recipe={dayPickerRecipe}
          onAdded={() => setDayPickerRecipe(null)}
        />
      )}

      {pickerEntry && (
        <DayPickerSheet
          open={!!pickerEntry}
          onClose={() => setPickerEntry(null)}
          recipe={{ id: "", title: pickerEntry.recipeTitle ?? pickerEntry.text ?? "", image: "", readyInMinutes: 0, servings: 0 }}
          entry={pickerEntry}
          onAdded={() => setPickerEntry(null)}
        />
      )}

      <RecipeDetailSheet
        recipe={viewingMenuRecipe}
        onClose={() => setViewingMenuRecipe(null)}
      />

      <CustomRecipeSheet
        open={!!viewingMenuCustom}
        onClose={() => setViewingMenuCustom(null)}
        existing={viewingMenuCustom ?? undefined}
        readOnly
      />

      {/* Add all entries from a saved menu to a day */}
      {addAllMenuId && (() => {
        const m = state.savedMenus.find((s) => s.id === addAllMenuId);
        return m ? (
          <DayPickerSheet
            open={!!addAllMenuId}
            onClose={() => setAddAllMenuId(null)}
            recipe={{ id: "", title: m.name, image: "", readyInMinutes: 0, servings: 0 }}
            entries={m.entries}
            onAdded={() => setAddAllMenuId(null)}
          />
        ) : null;
      })()}

      {/* Add items to a saved menu */}
      {addingToMenuId && (
        <AddEntrySheet
          open={!!addingToMenuId}
          onClose={() => setAddingToMenuId(null)}
          dateStr=""
          dateLabel={state.savedMenus.find((m) => m.id === addingToMenuId)?.name ?? "Menu"}
          onAddEntry={(entry) => {
            dispatch({ type: "ADD_ENTRY_TO_SAVED_MENU", savedMenuId: addingToMenuId, entry });
          }}
        />
      )}

      {/* New blank menu */}
      <SaveMenuSheet
        open={newMenuOpen}
        onClose={() => setNewMenuOpen(false)}
        entries={[]}
      />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Delete {confirmDelete.type === "recipe" ? "Recipe" : "Menu"}?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              &ldquo;{confirmDelete.name}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === "recipe") {
                    dispatch({ type: "REMOVE_CUSTOM_RECIPE", id: confirmDelete.id });
                  } else {
                    dispatch({ type: "DELETE_SAVED_MENU", id: confirmDelete.id });
                    if (expandedMenu === confirmDelete.id) setExpandedMenu(null);
                  }
                  setConfirmDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <TipSheet
        open={tipSheetOpen}
        onClose={() => { setTipSheetOpen(false); setEditingTip(undefined); }}
        existing={editingTip}
      />

      {/* Delete tip confirmation */}
      {confirmDeleteTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDeleteTip(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Delete Tip?</h2>
            <p className="text-sm text-gray-500 mb-5">
              &ldquo;{confirmDeleteTip.title}&rdquo; will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteTip(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  dispatch({ type: "DELETE_TIP", id: confirmDeleteTip.id });
                  setConfirmDeleteTip(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
