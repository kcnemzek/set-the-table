"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, BookOpen, Loader2 } from "lucide-react";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { useAppContext } from "@/store/context";
import type { RecipeSummary } from "@/types";

export default function DiscoverPage() {
  const { state } = useAppContext();

  const [query, setQuery] = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterDish, setFilterDish] = useState("");
  const [filterDiet, setFilterDiet] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsFromGenerate, setResultsFromGenerate] = useState(false);

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

  return (
    <div className="flex flex-col min-h-full p-4 gap-4">
      <div className="sticky top-0 z-20 bg-white -mx-4 px-4 pb-2 pt-3 space-y-2">
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
  );
}
