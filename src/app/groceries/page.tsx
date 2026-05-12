"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Plus, ShoppingCart, Tag, Trash2, EyeOff, ListFilter } from "lucide-react";
import GrocerySection from "@/components/groceries/GrocerySection";
import ManualAddSheet from "@/components/groceries/ManualAddSheet";
import StaplesTab from "@/components/groceries/StaplesTab";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { aggregateIngredients, groceryItemKey } from "@/lib/ingredient-utils";
import { getNext10Days } from "@/lib/dates";
import type { RecipeDetail, GroceryListByAisle } from "@/types";

const SNAPSHOT_KEY = "grocery-list-snapshot";

type Tab = "list" | "staples";

export default function GroceriesPage() {
  const { state, dispatch } = useAppContext();
  const [tab, setTab] = useState<Tab>("list");
  const [groceryList, setGroceryList] = useState<GroceryListByAisle>({});
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideChecked, setHideChecked] = useState<boolean>(() => {
    try { return localStorage.getItem("grocery-hide-checked") === "true"; } catch { return false; }
  });
  const [selectedStore, setSelectedStore] = useState<string | null>(() => {
    try { return localStorage.getItem("grocery-selected-store") ?? null; } catch { return null; }
  });
  const [offlineMode, setOfflineMode] = useState(false);
  const offlineModeRef = useRef(false);
  const [snapshotSavedAt, setSnapshotSavedAt] = useState<string | null>(null);
  const [pantryExpanded, setPantryExpanded] = useState(false);

  useEffect(() => {
    try { localStorage.setItem("grocery-hide-checked", String(hideChecked)); } catch { /* ignore */ }
  }, [hideChecked]);

  useEffect(() => {
    try {
      if (selectedStore) localStorage.setItem("grocery-selected-store", selectedStore);
      else localStorage.removeItem("grocery-selected-store");
    } catch { /* ignore */ }
  }, [selectedStore]);

  useEffect(() => {
    if (!navigator.onLine) {
      offlineModeRef.current = true;
      setOfflineMode(true);
      try {
        const raw = localStorage.getItem(SNAPSHOT_KEY);
        if (raw) {
          const { list, savedAt } = JSON.parse(raw);
          setGroceryList(list);
          setSnapshotSavedAt(savedAt);
        }
      } catch { /* ignore */ }
      setRecipeLoading(false);
    }
  }, []);

  const UNASSIGNED = "__unassigned__";

  const stores = useMemo(() => {
    return Array.from(new Set(Object.values(groceryList).flat().map((i) => i.store).filter(Boolean) as string[])).sort();
  }, [groceryList]);

  const buildRecipeList = useCallback(async () => {
    if (!state.hydrated) return;
    if (offlineModeRef.current) return;
    setRecipeLoading(true);

    const days = getNext10Days();
    const recipeIds = new Set<string>();
    const customRecipeIds = new Set<string>();

    for (const dateStr of days) {
      for (const entry of state.menu[dateStr] ?? []) {
        if (entry.type === "recipe" && entry.recipeId) {
          recipeIds.add(entry.recipeId);
        } else if (entry.type === "custom-recipe" && entry.customRecipeId) {
          customRecipeIds.add(entry.customRecipeId);
        }
      }
    }

    // Include dishes from event plans that have been added to groceries
    for (const plan of state.eventPlans) {
      if (!plan.addedToGroceries) continue;
      for (const dish of plan.dishes) {
        if (dish.recipeId) recipeIds.add(dish.recipeId);
        else if (dish.customRecipeId) customRecipeIds.add(dish.customRecipeId);
      }
    }

    const recipes: RecipeDetail[] = [];

    for (const id of recipeIds) {
      if (state.recipeCache[id]) {
        recipes.push(state.recipeCache[id]);
        continue;
      }
      try {
        const res = await fetch(`/api/recipes/${id}`);
        if (res.ok) {
          const detail: RecipeDetail = await res.json();
          dispatch({ type: "CACHE_RECIPE", recipe: detail });
          recipes.push(detail);
        }
      } catch { /* skip */ }
    }

    for (const id of customRecipeIds) {
      const cr = state.customRecipes.find((r) => r.id === id);
      if (cr) {
        recipes.push({
          id: cr.id,
          title: cr.title,
          image: "",
          readyInMinutes: 0,
          servings: cr.servings,
          extendedIngredients: cr.extendedIngredients,
        });
      }
    }

    const list = aggregateIngredients(recipes, state.manualGroceryItems, state.groceryItemStores);
    const savedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ list, savedAt })); } catch { /* ignore */ }
    setSnapshotSavedAt(savedAt);
    setGroceryList(list);
    setRecipeLoading(false);
  }, [state.hydrated, state.menu, state.customRecipes, state.manualGroceryItems, state.groceryItemStores, state.recipeCache, state.eventPlans, dispatch]);

  useEffect(() => { buildRecipeList(); }, [buildRecipeList]);

  // Post-filter by selected store
  const filteredGroceryList = useMemo((): GroceryListByAisle => {
    if (!selectedStore) return groceryList;
    const result: GroceryListByAisle = {};
    for (const [aisle, items] of Object.entries(groceryList)) {
      const filtered = items.filter((item) =>
        selectedStore === UNASSIGNED ? !item.store : item.store === selectedStore
      );
      if (filtered.length > 0) result[aisle] = filtered;
    }
    return result;
  }, [groceryList, selectedStore]);

  const hasUnassigned = useMemo(
    () => Object.values(groceryList).some((items) => items.some((item) => !item.store)),
    [groceryList]
  );

  const pantryHiddenItems = useMemo(() => {
    if (state.pantry.length === 0) return [];
    return Object.values(filteredGroceryList).flat().filter(
      (item) => state.pantry.includes(item.name.toLowerCase().trim())
    );
  }, [filteredGroceryList, state.pantry]);

  const pantryFilteredGroceryList = useMemo((): GroceryListByAisle => {
    if (state.pantry.length === 0) return filteredGroceryList;
    const result: GroceryListByAisle = {};
    for (const [aisle, items] of Object.entries(filteredGroceryList)) {
      const filtered = items.filter((item) => !state.pantry.includes(item.name.toLowerCase().trim()));
      if (filtered.length > 0) result[aisle] = filtered;
    }
    return result;
  }, [filteredGroceryList, state.pantry]);

  const aisles = Object.keys(pantryFilteredGroceryList);
  const totalRecipeItems = aisles.reduce((n, a) => n + pantryFilteredGroceryList[a].length, 0);
  const checkedCount = aisles.reduce((n, a) =>
    n + pantryFilteredGroceryList[a].filter((item) =>
      item.manualId ? item.checked : (state.groceryChecked[groceryItemKey(item.aisle, item.name, item.unit)] ?? false)
    ).length, 0
  );


  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Grocery List</h1>
            {!recipeLoading && totalRecipeItems > 0 && (
              <p className="text-xs text-gray-500">
                {hideChecked && checkedCount > 0
                  ? `${totalRecipeItems - checkedCount} of ${totalRecipeItems} items · ${checkedCount} hidden`
                  : checkedCount > 0
                  ? `${totalRecipeItems} items · ${checkedCount} shopped`
                  : `${totalRecipeItems} items`}
              </p>
            )}
          </div>
          {tab === "list" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideChecked((v) => !v)}
                className="flex items-center justify-center gap-1.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-200"
                style={{ width: 120, height: 38 }}
              >
                <ListFilter size={16} />
                {hideChecked ? "Show all" : "Hide checked"}
              </button>
              <button
                onClick={() => setAddSheetOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-brand-500 text-white rounded-xl text-sm font-medium active:bg-brand-600"
                style={{ width: 120, height: 38 }}
              >
                <Plus size={16} />
                Add item
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-2">
          {(["list", "staples"] as Tab[]).map((id) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {id === "list" ? "List" : `Staples${state.staples.length > 0 ? ` (${state.staples.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* Store filter chips — list tab only */}
        {tab === "list" && (stores.length > 0 || hasUnassigned) && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={() => setSelectedStore(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStore === null
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              All
            </button>
            {hasUnassigned && (
              <button
                onClick={() => setSelectedStore(selectedStore === UNASSIGNED ? null : UNASSIGNED)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedStore === UNASSIGNED
                    ? "bg-gray-600 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Unassigned
              </button>
            )}
            {stores.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStore(selectedStore === s ? null : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedStore === s
                    ? "bg-brand-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {offlineMode && (
        <div className="mx-4 mt-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-medium">
          Offline — showing list saved{snapshotSavedAt ? ` at ${snapshotSavedAt}` : ""}
        </div>
      )}

      {tab === "staples" ? (
        <StaplesTab />
      ) : recipeLoading ? (
        <LoadingSpinner className="py-16" />
      ) : aisles.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title="No items yet"
          description="Add recipes to your menu or tap 'Add item' to get started"
          action={
            <button
              onClick={() => setAddSheetOpen(true)}
              className="px-6 py-3 bg-brand-500 text-white rounded-xl text-sm font-semibold"
            >
              Add item
            </button>
          }
        />
      ) : (
        <>
          {aisles.map((aisle) => (
            <GrocerySection
              key={aisle}
              aisle={aisle}
              items={pantryFilteredGroceryList[aisle]}
              hideChecked={hideChecked}
            />
          ))}

          {pantryHiddenItems.length > 0 && (
            <div className="mx-4 mt-4 mb-2">
              <button
                onClick={() => setPantryExpanded((v) => !v)}
                className="flex items-center gap-2 text-xs text-gray-400 font-medium w-full text-left"
              >
                <EyeOff size={12} />
                {pantryHiddenItems.length} item{pantryHiddenItems.length !== 1 ? "s" : ""} always on hand (hidden)
                <span className="ml-auto">{pantryExpanded ? "▲" : "▼"}</span>
              </button>
              {pantryExpanded && (
                <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                  {pantryHiddenItems.map((item) => (
                    <div
                      key={`${item.aisle}-${item.name}-${item.unit}`}
                      className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 first:border-t-0"
                    >
                      <span className="flex-1 text-sm text-gray-400 capitalize">{item.name}</span>
                      <button
                        onClick={() => dispatch({ type: "REMOVE_FROM_PANTRY", name: item.name.toLowerCase().trim() })}
                        className="text-xs text-brand-500 hover:text-brand-700 font-medium"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "list" && <ManualAddSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />}
    </div>
  );
}
