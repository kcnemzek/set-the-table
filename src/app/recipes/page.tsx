"use client";

import { useState, useCallback } from "react";
import { Shuffle, Plus, Heart, BookOpen, Trash2, Loader2, Bookmark, ChevronRight } from "lucide-react";
import clsx from "clsx";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";
import type { RecipeSummary, CustomRecipe, DayEntry } from "@/types";

type Tab = "discover" | "favorites" | "custom" | "menus";

export default function RecipesPage() {
  const { state, dispatch } = useAppContext();
  const [tab, setTab] = useState<Tab>("discover");

  // Discover state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);

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

  const handleSearch = useCallback(async (token?: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const params = new URLSearchParams({ query, number: "10" });
      if (token) params.set("nextPageToken", token);
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
  }, [query]);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setHasSearched(true);
    setQuery("");
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
        {(["discover", "favorites", "custom", "menus"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-600"
            )}
          >
            {t === "discover" && "Discover"}
            {t === "favorites" && "Favorites"}
            {t === "custom" && "My Recipes"}
            {t === "menus" && "My Menus"}
          </button>
        ))}
      </div>

      {/* Discover Tab */}
      {tab === "discover" && (
        <div className="flex flex-col flex-1 p-4 gap-4">
          <div className="sticky top-[45px] z-10 bg-white -mx-4 px-4 pb-2 pt-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchBar
                  value={query}
                  onChange={setQuery}
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
                  <Shuffle size={16} />
                )}
                <span className="hidden sm:inline">Generate</span>
              </button>
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
              description='Search for recipes or tap "Generate" for inspiration'
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
                              {getRecipeEmoji(cr.title)}
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
                              onClick={() =>
                                dispatch({ type: "REMOVE_CUSTOM_RECIPE", id: cr.id })
                              }
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-xl"
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
          {state.savedMenus.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={48} />}
              title="No saved menus yet"
              description="Tap the bookmark icon on any day to save it as a menu"
            />
          ) : (
            state.savedMenus.map((savedMenu) => (
              <div key={savedMenu.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div
                  onClick={() => setExpandedMenu(expandedMenu === savedMenu.id ? null : savedMenu.id)}
                  className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                >
                  <Bookmark size={18} className="text-brand-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{savedMenu.name}</p>
                    <p className="text-xs text-gray-400">
                      {savedMenu.entries.length} item{savedMenu.entries.length !== 1 ? "s" : ""} · saved {new Date(savedMenu.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "DELETE_SAVED_MENU", id: savedMenu.id });
                        if (expandedMenu === savedMenu.id) setExpandedMenu(null);
                      }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                      title="Delete saved menu"
                    >
                      <Trash2 size={15} />
                    </button>
                    <ChevronRight
                      size={16}
                      className={clsx("text-gray-400 transition-transform", expandedMenu === savedMenu.id && "rotate-90")}
                    />
                  </div>
                </div>
                {expandedMenu === savedMenu.id && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {savedMenu.entries.map((entry) => (
                      <button
                        key={entry.id}
                        onClick={() => setPickerEntry(entry)}
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-brand-50 active:bg-brand-100"
                      >
                        {(entry.type === "recipe" || entry.type === "custom-recipe") && entry.recipeImage ? (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={entry.recipeImage} alt={entry.recipeTitle ?? ""} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-xl flex-shrink-0">
                            {entry.type === "event" ? "🎉" : entry.type === "text" ? "📝" : "🍽️"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2">{entry.recipeTitle ?? entry.text ?? ""}</p>
                          <p className="text-xs text-gray-400 capitalize">{entry.type === "custom-recipe" ? "my recipe" : entry.type}</p>
                        </div>
                        <Plus size={16} className="text-brand-400 flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
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
    </div>
  );
}
