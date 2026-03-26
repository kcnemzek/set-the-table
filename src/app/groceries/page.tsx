"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, ShoppingCart, Trash2, EyeOff, Eye } from "lucide-react";
import GrocerySection from "@/components/groceries/GrocerySection";
import ManualAddSheet from "@/components/groceries/ManualAddSheet";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { aggregateIngredients, groceryItemKey } from "@/lib/ingredient-utils";
import { getNext10Days } from "@/lib/dates";
import type { RecipeDetail, GroceryListByAisle } from "@/types";

export default function GroceriesPage() {
  const { state, dispatch } = useAppContext();
  const [groceryList, setGroceryList] = useState<GroceryListByAisle>({});
  const [loading, setLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);

  const buildList = useCallback(async () => {
    if (!state.hydrated) return;
    setLoading(true);

    // Collect all recipe IDs from the 10-day menu
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

    // Fetch Edamam recipe details (use cache when available)
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
      } catch {
        // skip on error
      }
    }

    // Add custom recipe details
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

    setGroceryList(aggregateIngredients(recipes, state.manualGroceryItems));
    setLoading(false);
  }, [state.hydrated, state.menu, state.customRecipes, state.manualGroceryItems, state.recipeCache, dispatch]);

  useEffect(() => {
    buildList();
  }, [buildList]);

  const aisles = Object.keys(groceryList);
  const totalItems = aisles.reduce((n, a) => n + groceryList[a].length, 0);
  const checkedCount = aisles.reduce((n, a) =>
    n + groceryList[a].filter((item) => state.groceryChecked[groceryItemKey(item.aisle, item.name, item.unit)] ?? false).length, 0
  );

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Grocery List</h1>
          {!loading && totalItems > 0 && (
            <p className="text-xs text-gray-500">
              {hideChecked && checkedCount > 0
                ? `${totalItems - checkedCount} of ${totalItems} items · ${checkedCount} hidden`
                : `${totalItems} items`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHideChecked((v) => !v)}
            className="flex items-center justify-center gap-1.5 w-[118px] py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-200"
          >
            {hideChecked ? <Eye size={16} /> : <EyeOff size={16} />}
            {hideChecked ? "Show all" : "Hide checked"}
          </button>
          <button
            onClick={() => setAddSheetOpen(true)}
            className="flex items-center justify-center gap-1.5 w-[118px] py-2 bg-brand-500 text-white rounded-xl text-sm font-medium active:bg-brand-600"
          >
            <Plus size={16} />
            Add item
          </button>
        </div>
      </div>

      {loading ? (
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
              items={groceryList[aisle]}
              hideChecked={hideChecked}
            />
          ))}

          {/* Manual items actions */}
          {state.manualGroceryItems.length > 0 && (
            <div className="px-4 mt-4">
              <button
                onClick={() =>
                  state.manualGroceryItems.forEach((item) =>
                    dispatch({ type: "REMOVE_MANUAL_GROCERY", id: item.id })
                  )
                }
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 py-2"
              >
                <Trash2 size={14} />
                Clear manually added items
              </button>
            </div>
          )}
        </>
      )}

      <ManualAddSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
    </div>
  );
}
