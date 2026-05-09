"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ShoppingCart, Tag, Trash2, EyeOff, Eye } from "lucide-react";
import GrocerySection from "@/components/groceries/GrocerySection";
import ManualAddSheet from "@/components/groceries/ManualAddSheet";
import StaplesTab from "@/components/groceries/StaplesTab";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { aggregateIngredients, groceryItemKey } from "@/lib/ingredient-utils";
import { getNext10Days } from "@/lib/dates";
import type { RecipeDetail, GroceryListByAisle } from "@/types";

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

  useEffect(() => {
    try { localStorage.setItem("grocery-hide-checked", String(hideChecked)); } catch { /* ignore */ }
  }, [hideChecked]);

  useEffect(() => {
    try {
      if (selectedStore) localStorage.setItem("grocery-selected-store", selectedStore);
      else localStorage.removeItem("grocery-selected-store");
    } catch { /* ignore */ }
  }, [selectedStore]);

  const UNASSIGNED = "__unassigned__";

  const stores = useMemo(() => {
    return Array.from(new Set(Object.values(groceryList).flat().map((i) => i.store).filter(Boolean) as string[])).sort();
  }, [groceryList]);

  const buildRecipeList = useCallback(async () => {
    if (!state.hydrated) return;
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

    setGroceryList(aggregateIngredients(recipes, state.manualGroceryItems, state.groceryItemStores));
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

  const aisles = Object.keys(filteredGroceryList);
  const totalRecipeItems = aisles.reduce((n, a) => n + filteredGroceryList[a].length, 0);
  const checkedCount = aisles.reduce((n, a) =>
    n + filteredGroceryList[a].filter((item) =>
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
                {hideChecked ? <Eye size={16} /> : <EyeOff size={16} />}
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
              items={filteredGroceryList[aisle]}
              hideChecked={hideChecked}
            />
          ))}
          {selectedStore && selectedStore !== UNASSIGNED && (
            <div className="px-4 mt-4">
              <button
                onClick={() => dispatch({ type: "RESET_STORE_ITEMS", store: selectedStore })}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 py-2"
              >
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 8A6.5 6.5 0 1 0 3 3.5" />
                  <path d="M1.5 3.5v4h4" />
                </svg>
                Reset {selectedStore} list
              </button>
            </div>
          )}
        </>
      )}

      {tab === "list" && <ManualAddSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />}
    </div>
  );
}
