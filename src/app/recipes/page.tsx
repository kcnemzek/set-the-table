"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, Plus, Heart, BookOpen, Trash2, Loader2, ChevronRight, Pencil, Check, Lightbulb, Share2, Search, X } from "lucide-react";
import clsx from "clsx";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import RecipeDetailSheet from "@/components/recipes/RecipeDetailSheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import TipSheet from "@/components/recipes/TipSheet";
import { shareRecipe } from "@/lib/share-recipe";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";
import type { RecipeSummary, CustomRecipe, Tip } from "@/types";

type Tab = "discover" | "favorites" | "custom" | "tips";

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
  const [viewingRecipe, setViewingRecipe] = useState<RecipeSummary | null>(null);

  // Custom sheet
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<CustomRecipe | undefined>();

  // Day picker for custom recipes
  const [dayPickerRecipe, setDayPickerRecipe] = useState<RecipeSummary | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  // Share state for list view
  const [sharedRecipeId, setSharedRecipeId] = useState<string | null>(null);

  // Tips state
  const [tipSheetOpen, setTipSheetOpen] = useState(false);
  const [editingTip, setEditingTip] = useState<Tip | undefined>();
  const [confirmDeleteTip, setConfirmDeleteTip] = useState<{ id: string; title: string } | null>(null);

  // Library search/filter (shared across Favorites + My Recipes)
  const [libQuery, setLibQuery] = useState("");
  const [libCategory, setLibCategory] = useState<string | null>(null);

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

  // Load favorites on mount so library search works immediately from any tab
  useEffect(() => {
    loadFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "favorites") loadFavorites();
  };

  const customToSummary = (cr: CustomRecipe): RecipeSummary => ({
    id: cr.id,
    title: cr.title,
    image: "",
    readyInMinutes: 0,
    servings: cr.servings,
  });

  const isLibFiltering = !!libQuery || !!libCategory;

  const favTextFiltered = libQuery.trim()
    ? favRecipes.filter((r) => r.title.toLowerCase().includes(libQuery.toLowerCase()))
    : favRecipes;
  const filteredFavs = libCategory
    ? favTextFiltered.filter((r) => getRecipeCategory(r.title).label === libCategory)
    : favTextFiltered;
  const customTextFiltered = libQuery.trim()
    ? state.customRecipes.filter((r) => r.title.toLowerCase().includes(libQuery.toLowerCase()))
    : state.customRecipes;
  const filteredCustom = libCategory
    ? customTextFiltered.filter((r) => getRecipeCategory(r.title, r.category).label === libCategory)
    : customTextFiltered;

  // Combined chips derived from both text-filtered sets
  const allChipCategories = [...new Map([
    ...favTextFiltered.map((r) => { const c = getRecipeCategory(r.title); return [c.label, c] as [string, typeof c]; }),
    ...customTextFiltered.map((r) => { const c = getRecipeCategory(r.title, r.category); return [c.label, c] as [string, typeof c]; }),
  ]).values()].sort((a, b) => a.label === "Other" ? 1 : b.label === "Other" ? -1 : a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col min-h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        {(["discover", "favorites", "custom", "tips"] as Tab[]).map((t) => (
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
            {t === "tips" && "Tips"}
          </button>
        ))}
      </div>

      {/* Library search bar — always visible, searches Favorites + My Recipes */}
      <div className="sticky top-[45px] z-10 bg-white border-b border-gray-100 px-4 py-3 space-y-2">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={libQuery}
              onChange={(e) => { setLibQuery(e.target.value); setLibCategory(null); }}
              placeholder="Search my library…"
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            />
            {libQuery && (
              <button
                onClick={() => { setLibQuery(""); setLibCategory(null); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {tab === "custom" && (
            <button
              onClick={() => { setEditingRecipe(undefined); setCustomSheetOpen(true); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-brand-500 text-white flex-shrink-0 active:bg-brand-600"
              title="New custom recipe"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
        {tab !== "discover" && allChipCategories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-none py-0.5">
            <button
              onClick={() => setLibCategory(null)}
              className={clsx(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                !libCategory ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200"
              )}
            >
              All
            </button>
            {allChipCategories.map(({ emoji, label }) => (
              <button
                key={label}
                onClick={() => setLibCategory(libCategory === label ? null : label)}
                className={clsx(
                  "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors",
                  libCategory === label ? "bg-brand-500 text-white border-brand-500" : "bg-white text-gray-600 border-gray-200"
                )}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Combined search results — shown instead of tab content when filtering */}
      {isLibFiltering && (
        <div className="p-4 space-y-5">
          {filteredCustom.length === 0 && filteredFavs.length === 0 ? (
            <EmptyState title="No matches" description="Try a different search or category" />
          ) : (
            <>
              {filteredCustom.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest px-1 pb-2">
                    <BookOpen size={12} />
                    My Recipes
                    <span className="font-normal normal-case tracking-normal text-gray-400">({filteredCustom.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredCustom.map((cr) => (
                      <div key={cr.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
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
                                  cr.extendedIngredients.length > 0 && `${cr.extendedIngredients.length} ingredient${cr.extendedIngredients.length !== 1 ? "s" : ""}`,
                                  cr.servings > 0 && `${cr.servings} servings`,
                                ].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => setDayPickerRecipe(customToSummary(cr))} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl" title="Add to menu">
                            <Plus size={18} />
                          </button>
                          <button
                            onClick={async () => { const copied = await shareRecipe(cr); if (copied) { setSharedRecipeId(cr.id); setTimeout(() => setSharedRecipeId(null), 2000); } }}
                            className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl"
                            title={sharedRecipeId === cr.id ? "Copied!" : "Share"}
                          >
                            <Share2 size={16} />
                          </button>
                          <button onClick={() => setConfirmDelete({ id: cr.id, name: cr.title })} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-50 rounded-xl" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {filteredFavs.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-widest px-1 pb-2">
                    <Heart size={12} className="text-red-400" />
                    Favorites
                    <span className="font-normal normal-case tracking-normal text-gray-400">({filteredFavs.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {filteredFavs.map((recipe) => (
                      <div key={recipe.id} className="bg-white rounded-2xl border border-gray-200 p-3 flex items-center gap-3">
                        <button onClick={() => setViewingRecipe(recipe)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                            {recipe.image
                              ? <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
                              : <span className="text-xl">{getRecipeEmoji(recipe.title)}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{recipe.title}</p>
                            {recipe.readyInMinutes > 0 && <p className="text-xs text-gray-500">{recipe.readyInMinutes} min</p>}
                          </div>
                        </button>
                        <button onClick={() => setDayPickerRecipe(recipe)} className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl" title="Add to menu">
                          <Plus size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Discover Tab */}
      {tab === "discover" && (
        <div className="flex flex-col flex-1 p-4 gap-4">
          <div className="sticky top-[112px] z-20 bg-white -mx-4 px-4 pb-2 pt-3 space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchBar
                  value={query}
                  onChange={(v) => { setQuery(v); if (v) setResultsFromGenerate(false); }}
                  onSubmit={() => handleSearch()}
                  placeholder="Discover new recipes…"
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
      {tab === "favorites" && !isLibFiltering && (
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
      {tab === "custom" && !isLibFiltering && (
        <div className="p-4">
          {state.customRecipes.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={<BookOpen size={48} />}
                title="No custom recipes yet"
                description="Add your own recipes with ingredients for the grocery list"
              />
            </div>
          ) : (
            <div className="space-y-4 mt-4">
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
                              onClick={async () => {
                                const copied = await shareRecipe(cr);
                                if (copied) {
                                  setSharedRecipeId(cr.id);
                                  setTimeout(() => setSharedRecipeId(null), 2000);
                                }
                              }}
                              className="p-2 text-gray-500 hover:text-brand-500 hover:bg-brand-50 rounded-xl"
                              title={sharedRecipeId === cr.id ? "Copied!" : "Share"}
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: cr.id, name: cr.title })}
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

      <RecipeDetailSheet
        recipe={viewingRecipe}
        onClose={() => setViewingRecipe(null)}
      />

      {dayPickerRecipe && (
        <DayPickerSheet
          open={!!dayPickerRecipe}
          onClose={() => setDayPickerRecipe(null)}
          recipe={dayPickerRecipe}
          onAdded={() => setDayPickerRecipe(null)}
        />
      )}

      {/* Delete recipe confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-gray-800 mb-1">Delete Recipe?</h2>
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
                  dispatch({ type: "REMOVE_CUSTOM_RECIPE", id: confirmDelete.id });
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
