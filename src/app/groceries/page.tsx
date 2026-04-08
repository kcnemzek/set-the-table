"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ShoppingCart, Trash2, EyeOff, Eye, Users } from "lucide-react";
import GrocerySection from "@/components/groceries/GrocerySection";
import ManualAddSheet from "@/components/groceries/ManualAddSheet";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAppContext } from "@/store/context";
import { aggregateIngredients, groceryItemKey } from "@/lib/ingredient-utils";
import { getNext10Days } from "@/lib/dates";
import type { RecipeDetail, GroceryListByAisle, FamilyGroceryItem } from "@/types";

type Tab = "recipes" | "family" | "all";

export default function GroceriesPage() {
  const { state, dispatch } = useAppContext();
  const [tab, setTab] = useState<Tab>("all");
  const [groceryList, setGroceryList] = useState<GroceryListByAisle>({});
  const [recipeLoading, setRecipeLoading] = useState(true);
  const [familyItems, setFamilyItems] = useState<FamilyGroceryItem[]>([]);
  const [familyLoading, setFamilyLoading] = useState(true);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);

  // All unique store names from manual items
  const stores = useMemo(() =>
    Array.from(new Set(
      state.manualGroceryItems.map((i) => i.store).filter(Boolean) as string[]
    )).sort(),
    [state.manualGroceryItems]
  );

  // Manual items visible under the current store filter
  const filteredManualItems = useMemo(() => {
    if (!selectedStore) return state.manualGroceryItems;
    return state.manualGroceryItems.filter((i) => !i.store || i.store === selectedStore);
  }, [state.manualGroceryItems, selectedStore]);

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

    setGroceryList(aggregateIngredients(recipes, filteredManualItems));
    setRecipeLoading(false);
  }, [state.hydrated, state.menu, state.customRecipes, filteredManualItems, state.recipeCache, dispatch]);

  useEffect(() => { buildRecipeList(); }, [buildRecipeList]);

  // Fetch family grocery items
  useEffect(() => {
    setFamilyLoading(true);
    fetch("/api/groceries/family")
      .then((r) => r.ok ? r.json() : { items: [] })
      .then(({ items }) => setFamilyItems(items ?? []))
      .finally(() => setFamilyLoading(false));
  }, []);

  async function handleClearFamilyItems() {
    await fetch("/api/groceries/family", { method: "DELETE" });
    setFamilyItems([]);
  }

  async function handleRemoveFamilyItem(id: string) {
    await fetch(`/api/groceries/family/${id}`, { method: "DELETE" });
    setFamilyItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleToggleFamilyItem(id: string, checked: boolean) {
    setFamilyItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked } : i)));
    await fetch(`/api/groceries/family/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checked }),
    });
  }

  const aisles = Object.keys(groceryList);
  const totalRecipeItems = aisles.reduce((n, a) => n + groceryList[a].length, 0);
  const checkedCount = aisles.reduce((n, a) =>
    n + groceryList[a].filter((item) =>
      state.groceryChecked[groceryItemKey(item.aisle, item.name, item.unit)] ?? false
    ).length, 0
  );

  const loading = tab === "family" ? familyLoading : recipeLoading;

  const familyCheckedCount = familyItems.filter((i) => i.checked).length;
  const visibleFamilyItems = hideChecked ? familyItems.filter((i) => !i.checked) : familyItems;

  // Group visible family items by who added them
  const familyByMember = visibleFamilyItems.reduce<Record<string, FamilyGroceryItem[]>>((acc, item) => {
    (acc[item.addedBy] ??= []).push(item);
    return acc;
  }, {});

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "recipes", label: "Recipes" },
    { id: "family", label: `Family${familyItems.length > 0 ? ` (${familyItems.length})` : ""}` },
  ];

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-gray-800">Grocery List</h1>
            {!loading && tab === "family" && familyItems.length > 0 && (
              <p className="text-xs text-gray-500">
                {hideChecked && familyCheckedCount > 0
                  ? `${familyItems.length - familyCheckedCount} of ${familyItems.length} items · ${familyCheckedCount} hidden`
                  : familyCheckedCount > 0
                  ? `${familyItems.length} items · ${familyCheckedCount} shopped`
                  : `${familyItems.length} items`}
              </p>
            )}
            {!loading && (tab === "recipes" || tab === "all") && totalRecipeItems > 0 && (
              <p className="text-xs text-gray-500">
                {hideChecked && checkedCount > 0
                  ? `${totalRecipeItems - checkedCount} of ${totalRecipeItems} items · ${checkedCount} hidden`
                  : checkedCount > 0
                  ? `${totalRecipeItems} items · ${checkedCount} shopped`
                  : `${totalRecipeItems} items`}
              </p>
            )}
          </div>
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
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-white text-gray-800 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Store filter chips */}
        {stores.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pt-2 pb-0.5 -mx-1 px-1 no-scrollbar">
            <button
              onClick={() => setSelectedStore(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedStore === null
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              All stores
            </button>
            {stores.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStore(selectedStore === s ? null : s)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
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

      {loading ? (
        <LoadingSpinner className="py-16" />
      ) : (
        <>
          {/* ── Recipes tab ── */}
          {(tab === "recipes" || tab === "all") && (
            <>
              {aisles.length === 0 && tab === "recipes" ? (
                <EmptyState
                  icon={<ShoppingCart size={48} />}
                  title="No recipe items"
                  description="Add recipes to your menu to see ingredients here"
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
                  {(state.manualGroceryItems.some((i) => !i.store) || selectedStore) && (
                    <div className="px-4 mt-4 flex flex-col gap-1">
                      {state.manualGroceryItems.some((i) => !i.store) && (
                        <button
                          onClick={() =>
                            state.manualGroceryItems
                              .filter((i) => !i.store)
                              .forEach((item) =>
                                dispatch({ type: "REMOVE_MANUAL_GROCERY", id: item.id })
                              )
                          }
                          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 py-2"
                        >
                          <Trash2 size={14} />
                          Clear one-time items
                        </button>
                      )}
                      {selectedStore && (
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
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── Family tab ── */}
          {(tab === "family" || tab === "all") && (
            <div className={tab === "all" && aisles.length > 0 ? "mt-2 border-t border-gray-200 pt-2" : ""}>
              {tab === "all" && (
                <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                  <Users size={14} className="text-gray-500" />
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Family Requests</h2>
                </div>
              )}

              {familyItems.length === 0 ? (
                tab === "family" ? (
                  <EmptyState
                    icon={<Users size={48} />}
                    title="No family requests"
                    description="Family members can add items from their invite link"
                  />
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4 px-4">No family requests yet</p>
                )
              ) : (
                <>
                  {Object.entries(familyByMember).map(([memberName, items]) => (
                    <div key={memberName}>
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 pt-4 pb-2">
                        {memberName}
                      </h3>
                      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mx-4">
                        {items.map((item, i) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleFamilyItem(item.id, !item.checked)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${i > 0 ? "border-t border-gray-50" : ""} ${item.checked ? "bg-gray-100" : "hover:bg-gray-50 active:bg-gray-100"}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${item.checked ? "bg-brand-500 border-brand-500" : "border-gray-300"}`}>
                              {item.checked && (
                                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white" fill="none">
                                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            <span className={`flex-1 text-sm ${item.checked ? "text-gray-400 line-through" : "text-gray-800"}`}>
                              {item.name}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveFamilyItem(item.id); }}
                              className="text-gray-300 hover:text-red-400 transition-colors p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {hideChecked && familyCheckedCount > 0 && (
                    <p className="text-xs text-gray-400 text-center pt-3 px-4">
                      {familyCheckedCount} checked {familyCheckedCount === 1 ? "item" : "items"} hidden
                    </p>
                  )}

                  <div className="px-4 mt-4">
                    <button
                      onClick={handleClearFamilyItems}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 py-2"
                    >
                      <Trash2 size={14} />
                      Clear all family requests
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Empty state for All tab */}
          {tab === "all" && aisles.length === 0 && familyItems.length === 0 && (
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
          )}
        </>
      )}

      <ManualAddSheet open={addSheetOpen} onClose={() => setAddSheetOpen(false)} />
    </div>
  );
}
