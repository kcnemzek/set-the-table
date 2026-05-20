"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles, BookOpen, Loader2, Search, Globe } from "lucide-react";
import RecipeCard from "@/components/recipes/RecipeCard";
import SearchBar from "@/components/recipes/SearchBar";
import WebSearchResultCard from "@/components/recipes/WebSearchResultCard";
import EmptyState from "@/components/shared/EmptyState";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import CustomRecipeSheet from "@/components/recipes/CustomRecipeSheet";
import { useAppContext } from "@/store/context";
import type { RecipeSummary } from "@/types";
import type { WebSearchResult } from "@/lib/recipe-search";

type DiscoverMode = "browse" | "web-search";

interface ImportPrefill {
  title?: string;
  servings?: number;
  directions?: string;
  url?: string;
  ingredients?: { text: string; aisle: string }[];
}

export default function DiscoverPage() {
  const { state } = useAppContext();

  // ── Browse mode state ────────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [filterCuisine, setFilterCuisine] = useState("");
  const [filterDish, setFilterDish] = useState("");
  const [filterDiet, setFilterDiet] = useState("");
  const [results, setResults] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);
  const [resultsFromGenerate, setResultsFromGenerate] = useState(false);

  // ── Web search mode state ────────────────────────────────────────────────────
  const [mode, setMode] = useState<DiscoverMode>("browse");
  const [webQuery, setWebQuery] = useState("");
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [webLoading, setWebLoading] = useState(false);
  const [webHasSearched, setWebHasSearched] = useState(false);
  const [importingUrl, setImportingUrl] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<Record<string, string>>({});

  // ── Import sheet state ───────────────────────────────────────────────────────
  const [importSheetOpen, setImportSheetOpen] = useState(false);
  const [importPrefill, setImportPrefill] = useState<ImportPrefill | undefined>();

  // ── Browse handlers ──────────────────────────────────────────────────────────
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

  // ── Web search handlers ──────────────────────────────────────────────────────
  const handleWebSearch = useCallback(async () => {
    if (!webQuery.trim()) return;
    setWebLoading(true);
    setWebHasSearched(true);
    setWebResults([]);
    setImportErrors({});
    try {
      const params = new URLSearchParams({ query: webQuery });
      const res = await fetch(`/api/recipes/web-search?${params}`);
      const data = await res.json();
      setWebResults(data.results ?? []);
    } catch {
      setWebResults([]);
    } finally {
      setWebLoading(false);
    }
  }, [webQuery]);

  const handleImport = useCallback(async (result: WebSearchResult) => {
    setImportingUrl(result.url);
    setImportErrors((prev) => {
      const next = { ...prev };
      delete next[result.url];
      return next;
    });
    try {
      const res = await fetch("/api/recipes/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: result.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? data.error ?? "Import failed");
      setImportPrefill({
        title: data.title,
        servings: data.servings || undefined,
        directions: data.directions,
        url: result.url,
        ingredients: data.ingredients,
      });
      setImportSheetOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not import this recipe. Try viewing the page and pasting the text instead.";
      setImportErrors((prev) => ({ ...prev, [result.url]: message }));
    } finally {
      setImportingUrl(null);
    }
  }, []);

  const handleImportSheetClose = () => {
    setImportSheetOpen(false);
    setImportPrefill(undefined);
  };

  // ── Mode toggle ──────────────────────────────────────────────────────────────
  const switchMode = (next: DiscoverMode) => {
    setMode(next);
  };

  return (
    <div className="flex flex-col min-h-full p-4 gap-4">
      {/* ── Mode toggle ── */}
      <div className="sticky top-0 z-20 bg-white -mx-4 px-4 pb-2 pt-3 space-y-2">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => switchMode("browse")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "browse"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Search size={14} />
            Browse
          </button>
          <button
            onClick={() => switchMode("web-search")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "web-search"
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Globe size={14} />
            Web Search
          </button>
        </div>

        {/* ── Browse controls ── */}
        {mode === "browse" && (
          <>
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
          </>
        )}

        {/* ── Web search controls ── */}
        {mode === "web-search" && (
          <SearchBar
            value={webQuery}
            onChange={setWebQuery}
            onSubmit={handleWebSearch}
            placeholder="e.g. best mac and cheese recipe, jammy eggs…"
          />
        )}
      </div>

      {/* ── Browse results ── */}
      {mode === "browse" && (
        loading && results.length === 0 ? (
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
            description="Search for recipes or tap ✨ for inspiration"
          />
        )
      )}

      {/* ── Web search results ── */}
      {mode === "web-search" && (
        webLoading ? (
          <LoadingSpinner className="py-16" />
        ) : webResults.length > 0 ? (
          <div className="flex flex-col gap-3">
            {webResults.map((result) => (
              <WebSearchResultCard
                key={result.url}
                result={result}
                onImport={handleImport}
                importing={importingUrl === result.url}
                importError={importErrors[result.url]}
              />
            ))}
          </div>
        ) : webHasSearched ? (
          <EmptyState title="No results found" description="Try a different search term" />
        ) : (
          <EmptyState
            icon={<Globe size={48} />}
            title="Search the web for recipes"
            description={"Try “best mac and cheese” or “easy weeknight pasta”"}
          />
        )
      )}

      {/* ── Import sheet ── */}
      <CustomRecipeSheet
        open={importSheetOpen}
        onClose={handleImportSheetClose}
        prefill={importPrefill}
      />
    </div>
  );
}
