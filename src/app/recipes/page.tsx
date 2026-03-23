"use client";

import { useState, useCallback } from "react";
import { Shuffle, Plus, Heart, BookOpen, Pencil, Trash2, Loader2 } from "lucide-react";
import clsx from "clsx";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import DayPickerSheet from "@/components/recipes/DayPickerSheet";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import type { RecipeSummary, CustomRecipe } from "@/types";

type Tab = "discover" | "favorites" | "custom";

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
      <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
        {(["discover", "favorites", "custom"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={clsx(
              "flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            {t === "discover" && "Discover"}
            {t === "favorites" && "Favorites"}
            {t === "custom" && "My Recipes"}
          </button>
        ))}
      </div>

      {/* Discover Tab */}
      {tab === "discover" && (
        <div className="flex flex-col flex-1 p-4 gap-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {favRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
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
          <button
            onClick={() => {
              setEditingRecipe(undefined);
              setCustomSheetOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-3 mb-4 border-2 border-dashed border-brand-200 text-brand-500 rounded-xl text-sm font-medium hover:bg-brand-50 active:bg-brand-100"
          >
            <Plus size={18} />
            New Custom Recipe
          </button>

          {state.customRecipes.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={48} />}
              title="No custom recipes yet"
              description="Add your own recipes with ingredients for the grocery list"
            />
          ) : (
            <div className="space-y-2">
              {state.customRecipes.map((cr) => (
                <div
                  key={cr.id}
                  className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg flex-shrink-0">
                    {cr.title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{cr.title}</p>
                    <p className="text-xs text-gray-400">
                      {cr.extendedIngredients.length} ingredient
                      {cr.extendedIngredients.length !== 1 ? "s" : ""} · {cr.servings} servings
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setDayPickerRecipe(customToSummary(cr))}
                      className="p-2 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl"
                      title="Add to menu"
                    >
                      <Plus size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingRecipe(cr);
                        setCustomSheetOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() =>
                        dispatch({ type: "REMOVE_CUSTOM_RECIPE", id: cr.id })
                      }
                      className="p-2 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
    </div>
  );
}
