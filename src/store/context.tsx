"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type {
  Menu,
  DayEntry,
  CustomRecipe,
  ManualGroceryItem,
  RecipeDetail,
  SavedMenu,
  Tip,
  FamilyMember,
  EventPlan,
  EventDish,
  EventTask,
} from "@/types";
import { STORES as DEFAULT_STORES } from "@/lib/stores";

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  menu: Menu;
  favorites: string[];
  dislikedRecipes: string[];
  customRecipes: CustomRecipe[];
  manualGroceryItems: ManualGroceryItem[];
  /** key: aisle|name|unit → checked for auto-generated grocery items */
  groceryChecked: Record<string, boolean>;
  /** key: aisle|name|unit → store for recipe ingredients */
  groceryItemStores: Record<string, string>;
  familyMembers: FamilyMember[];
  stores: string[];
  savedMenus: SavedMenu[];
  tips: Tip[];
  eventPlans: EventPlan[];
  /** cache of full recipe details fetched for grocery aggregation */
  recipeCache: Record<string, RecipeDetail>;
  hydrated: boolean;
}

const initialState: AppState = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
  groceryItemStores: {},
  familyMembers: [],
  stores: [...DEFAULT_STORES],
  savedMenus: [],
  tips: [],
  eventPlans: [],
  recipeCache: {},
  hydrated: false,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | {
      type: "HYDRATE";
      payload: Omit<AppState, "hydrated" | "recipeCache">;
    }
  | { type: "ADD_DAY_ENTRY"; dateStr: string; entry: DayEntry }
  | { type: "REMOVE_DAY_ENTRY"; dateStr: string; entryId: string }
  | { type: "REORDER_DAY_ENTRIES"; dateStr: string; entries: DayEntry[] }
  | { type: "UPDATE_DAY_ENTRY"; dateStr: string; entry: DayEntry }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "TOGGLE_DISLIKED"; id: string }
  | { type: "ADD_CUSTOM_RECIPE"; recipe: CustomRecipe }
  | { type: "UPDATE_CUSTOM_RECIPE"; recipe: CustomRecipe }
  | { type: "REMOVE_CUSTOM_RECIPE"; id: string }
  | { type: "ADD_MANUAL_GROCERY"; item: ManualGroceryItem }
  | { type: "REMOVE_MANUAL_GROCERY"; id: string }
  | { type: "TOGGLE_MANUAL_GROCERY_CHECKED"; id: string }
  | { type: "TOGGLE_GROCERY_CHECKED"; key: string }
  | { type: "CACHE_RECIPE"; recipe: RecipeDetail }
  | { type: "ADD_FAMILY_MEMBER"; member: FamilyMember }
  | { type: "REMOVE_FAMILY_MEMBER"; id: string }
  | { type: "ADD_STORE"; name: string }
  | { type: "REMOVE_STORE"; name: string }
  | { type: "SAVE_DAY_AS_MENU"; savedMenu: SavedMenu }
  | { type: "DELETE_SAVED_MENU"; id: string }
  | { type: "RENAME_SAVED_MENU"; id: string; name: string }
  | { type: "ADD_ENTRY_TO_SAVED_MENU"; savedMenuId: string; entry: DayEntry }
  | { type: "ADD_TIP"; tip: Tip }
  | { type: "UPDATE_TIP"; tip: Tip }
  | { type: "DELETE_TIP"; id: string }
  | { type: "RESET_STORE_ITEMS"; store: string }
  | { type: "SET_STORE_FOR_ALL_UNASSIGNED"; store: string }
  | { type: "SET_ITEM_STORE"; key: string; store: string | undefined }
  | { type: "SET_MANUAL_GROCERY_STORE"; id: string; store: string | undefined }
  | { type: "ADD_EVENT_PLAN"; plan: EventPlan }
  | { type: "UPDATE_EVENT_PLAN"; plan: EventPlan }
  | { type: "DELETE_EVENT_PLAN"; id: string }
  | { type: "COPY_EVENT_PLAN"; sourceId: string; newId: string; name: string; date: string }
  | { type: "ADD_EVENT_DISH"; planId: string; dish: EventDish }
  | { type: "REMOVE_EVENT_DISH"; planId: string; dishId: string }
  | { type: "ADD_EVENT_TASK"; planId: string; task: EventTask }
  | { type: "UPDATE_EVENT_TASK"; planId: string; task: EventTask }
  | { type: "REMOVE_EVENT_TASK"; planId: string; taskId: string }
  | { type: "TOGGLE_EVENT_GROCERIES"; planId: string }
  | { type: "REORDER_EVENT_DISHES"; planId: string; dishes: EventDish[] }
  | { type: "REORDER_EVENT_TASKS"; planId: string; tasks: EventTask[] };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        ...action.payload,
        stores: action.payload.stores?.length ? action.payload.stores : [...DEFAULT_STORES],
        recipeCache: {},
        hydrated: true,
      };

    case "ADD_DAY_ENTRY": {
      const existing = state.menu[action.dateStr] ?? [];
      return {
        ...state,
        menu: { ...state.menu, [action.dateStr]: [...existing, action.entry] },
      };
    }

    case "REMOVE_DAY_ENTRY": {
      const updated = (state.menu[action.dateStr] ?? []).filter(
        (e) => e.id !== action.entryId
      );
      return {
        ...state,
        menu: { ...state.menu, [action.dateStr]: updated },
      };
    }

    case "REORDER_DAY_ENTRIES":
      return { ...state, menu: { ...state.menu, [action.dateStr]: action.entries } };

    case "UPDATE_DAY_ENTRY": {
      const updated = (state.menu[action.dateStr] ?? []).map((e) =>
        e.id === action.entry.id ? action.entry : e
      );
      return {
        ...state,
        menu: { ...state.menu, [action.dateStr]: updated },
      };
    }

    case "TOGGLE_FAVORITE": {
      const exists = state.favorites.includes(action.id);
      return {
        ...state,
        favorites: exists
          ? state.favorites.filter((id) => id !== action.id)
          : [...state.favorites, action.id],
      };
    }

    case "TOGGLE_DISLIKED": {
      const exists = state.dislikedRecipes.includes(action.id);
      return {
        ...state,
        dislikedRecipes: exists
          ? state.dislikedRecipes.filter((id) => id !== action.id)
          : [...state.dislikedRecipes, action.id],
      };
    }

    case "ADD_CUSTOM_RECIPE":
      return { ...state, customRecipes: [...state.customRecipes, action.recipe] };

    case "UPDATE_CUSTOM_RECIPE": {
      const updatedMenu = Object.fromEntries(
        Object.entries(state.menu).map(([date, entries]) => [
          date,
          entries.map((e) =>
            e.type === "custom-recipe" && e.customRecipeId === action.recipe.id
              ? { ...e, recipeTitle: action.recipe.title }
              : e
          ),
        ])
      );
      return {
        ...state,
        customRecipes: state.customRecipes.map((r) =>
          r.id === action.recipe.id ? action.recipe : r
        ),
        menu: updatedMenu,
      };
    }

    case "REMOVE_CUSTOM_RECIPE":
      return {
        ...state,
        customRecipes: state.customRecipes.filter((r) => r.id !== action.id),
      };

    case "ADD_MANUAL_GROCERY":
      return {
        ...state,
        manualGroceryItems: [...state.manualGroceryItems, action.item],
      };

    case "REMOVE_MANUAL_GROCERY":
      return {
        ...state,
        manualGroceryItems: state.manualGroceryItems.filter(
          (i) => i.id !== action.id
        ),
      };

    case "TOGGLE_MANUAL_GROCERY_CHECKED":
      return {
        ...state,
        manualGroceryItems: state.manualGroceryItems.map((i) =>
          i.id === action.id ? { ...i, checked: !i.checked } : i
        ),
      };

    case "TOGGLE_GROCERY_CHECKED":
      return {
        ...state,
        groceryChecked: {
          ...state.groceryChecked,
          [action.key]: !state.groceryChecked[action.key],
        },
      };

    case "CACHE_RECIPE":
      return {
        ...state,
        recipeCache: { ...state.recipeCache, [action.recipe.id]: action.recipe },
      };

    case "ADD_FAMILY_MEMBER":
      if (state.familyMembers.some((m) => m.id === action.member.id)) return state;
      return { ...state, familyMembers: [...state.familyMembers, action.member] };

    case "REMOVE_FAMILY_MEMBER":
      return {
        ...state,
        familyMembers: state.familyMembers.filter((m) => m.id !== action.id),
      };

    case "ADD_STORE":
      if (state.stores.includes(action.name)) return state;
      return { ...state, stores: [...state.stores, action.name].sort() };

    case "REMOVE_STORE":
      return { ...state, stores: state.stores.filter((s) => s !== action.name) };

    case "SAVE_DAY_AS_MENU":
      return { ...state, savedMenus: [...state.savedMenus, action.savedMenu] };

    case "DELETE_SAVED_MENU":
      return { ...state, savedMenus: state.savedMenus.filter((m) => m.id !== action.id) };

    case "RENAME_SAVED_MENU":
      return {
        ...state,
        savedMenus: state.savedMenus.map((m) =>
          m.id === action.id ? { ...m, name: action.name } : m
        ),
      };

    case "ADD_ENTRY_TO_SAVED_MENU":
      return {
        ...state,
        savedMenus: state.savedMenus.map((m) =>
          m.id === action.savedMenuId ? { ...m, entries: [...m.entries, action.entry] } : m
        ),
      };

    case "ADD_TIP":
      return { ...state, tips: [...state.tips, action.tip] };

    case "UPDATE_TIP":
      return { ...state, tips: state.tips.map((t) => t.id === action.tip.id ? action.tip : t) };

    case "DELETE_TIP":
      return { ...state, tips: state.tips.filter((t) => t.id !== action.id) };

    case "RESET_STORE_ITEMS": {
      const updatedManual = state.manualGroceryItems.map((i) =>
        i.store === action.store ? { ...i, checked: false } : i
      );
      const updatedChecked = { ...state.groceryChecked };
      // Uncheck recipe ingredients assigned to this store
      for (const [key, store] of Object.entries(state.groceryItemStores)) {
        if (store === action.store) updatedChecked[key] = false;
      }
      // Uncheck manual items assigned to this store (UI reads from groceryChecked for all items)
      for (const item of state.manualGroceryItems) {
        if (item.store === action.store) {
          const key = `${item.aisle}|${item.name.toLowerCase()}|${item.unit.toLowerCase()}`;
          updatedChecked[key] = false;
        }
      }
      return { ...state, manualGroceryItems: updatedManual, groceryChecked: updatedChecked };
    }

    case "SET_STORE_FOR_ALL_UNASSIGNED":
      return {
        ...state,
        manualGroceryItems: state.manualGroceryItems.map((i) =>
          !i.store ? { ...i, store: action.store } : i
        ),
      };

    case "SET_ITEM_STORE": {
      const updated = { ...state.groceryItemStores };
      if (action.store) updated[action.key] = action.store;
      else delete updated[action.key];
      return { ...state, groceryItemStores: updated };
    }

    case "SET_MANUAL_GROCERY_STORE":
      return {
        ...state,
        manualGroceryItems: state.manualGroceryItems.map((i) =>
          i.id === action.id ? { ...i, store: action.store } : i
        ),
      };

    case "ADD_EVENT_PLAN":
      return { ...state, eventPlans: [...state.eventPlans, action.plan] };

    case "UPDATE_EVENT_PLAN": {
      const existing = state.eventPlans.find((p) => p.id === action.plan.id);
      const plan = (existing && existing.date !== action.plan.date)
        ? {
            ...action.plan,
            tasks: action.plan.tasks.map((t) => {
              if (t.daysBeforeEvent !== undefined) {
                const d = new Date(action.plan.date + "T00:00:00");
                d.setDate(d.getDate() - t.daysBeforeEvent);
                return { ...t, date: d.toISOString().slice(0, 10) };
              }
              return t;
            }),
          }
        : action.plan;
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === plan.id ? plan : p) };
    }

    case "DELETE_EVENT_PLAN":
      return { ...state, eventPlans: state.eventPlans.filter((p) => p.id !== action.id) };

    case "COPY_EVENT_PLAN": {
      const source = state.eventPlans.find((p) => p.id === action.sourceId);
      if (!source) return state;
      const newPlan: EventPlan = {
        ...source,
        id: action.newId,
        name: action.name,
        date: action.date,
        createdAt: new Date().toISOString(),
        dishes: source.dishes.map((d) => ({ ...d, id: crypto.randomUUID() })),
        tasks: source.tasks.map((t) => {
          const newTask = { ...t, id: crypto.randomUUID(), completed: false };
          // Recalculate absolute date for relative tasks using new event date
          if (t.daysBeforeEvent !== undefined) {
            const d = new Date(action.date + "T00:00:00");
            d.setDate(d.getDate() - t.daysBeforeEvent);
            newTask.date = d.toISOString().slice(0, 10);
          }
          return newTask;
        }),
      };
      return { ...state, eventPlans: [...state.eventPlans, newPlan] };
    }

    case "ADD_EVENT_DISH":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, dishes: [...p.dishes, action.dish] } : p) };

    case "REMOVE_EVENT_DISH":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, dishes: p.dishes.filter((d) => d.id !== action.dishId) } : p) };

    case "ADD_EVENT_TASK":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, tasks: [...p.tasks, action.task] } : p) };

    case "UPDATE_EVENT_TASK":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, tasks: p.tasks.map((t) => t.id === action.task.id ? action.task : t) } : p) };

    case "REMOVE_EVENT_TASK":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, tasks: p.tasks.filter((t) => t.id !== action.taskId) } : p) };

    case "TOGGLE_EVENT_GROCERIES":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, addedToGroceries: !p.addedToGroceries } : p) };

    case "REORDER_EVENT_DISHES":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, dishes: action.dishes } : p) };

    case "REORDER_EVENT_TASKS":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, tasks: action.tasks } : p) };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  addDayEntry: (dateStr: string, entry: DayEntry) => void;
  removeDayEntry: (dateStr: string, entryId: string) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleDisliked: (id: string) => void;
  isDisliked: (id: string) => boolean;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (id: string) => void;
  forceSave: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrationOk = useRef(false);

  // Hydrate from server on mount
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((data) => {
        hydrationOk.current = true;
        dispatch({
          type: "HYDRATE",
          payload: {
            menu: data.menu ?? {},
            favorites: data.favorites ?? [],
            dislikedRecipes: data.dislikedRecipes ?? [],
            customRecipes: data.customRecipes ?? [],
            manualGroceryItems: data.manualGroceryItems ?? [],
            groceryChecked: data.groceryChecked ?? {},
            groceryItemStores: data.groceryItemStores ?? {},
            familyMembers: data.familyMembers ?? [],
            savedMenus: data.savedMenus ?? [],
            tips: data.tips ?? [],
            eventPlans: data.eventPlans ?? [],
            stores: data.stores ?? [],
          },
        });
      })
      .catch(() => {
        hydrationOk.current = true;
        dispatch({ type: "HYDRATE", payload: { ...initialState } });
      });
  }, []);

  // Persist on state changes (debounced 500ms)
  useEffect(() => {
    if (!state.hydrated || !hydrationOk.current) return;
    const handler = setTimeout(() => {
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu: state.menu,
          favorites: state.favorites,
          dislikedRecipes: state.dislikedRecipes,
          customRecipes: state.customRecipes,
          manualGroceryItems: state.manualGroceryItems,
          groceryChecked: state.groceryChecked,
          groceryItemStores: state.groceryItemStores,
          familyMembers: state.familyMembers,
          savedMenus: state.savedMenus,
          tips: state.tips,
          eventPlans: state.eventPlans,
        }),
      });
    }, 500);
    return () => clearTimeout(handler);
  }, [
    state.menu,
    state.favorites,
    state.dislikedRecipes,
    state.customRecipes,
    state.manualGroceryItems,
    state.groceryChecked,
    state.groceryItemStores,
    state.familyMembers,
    state.savedMenus,
    state.tips,
    state.eventPlans,
    state.hydrated,
  ]);

  const addDayEntry = useCallback(
    (dateStr: string, entry: DayEntry) =>
      dispatch({ type: "ADD_DAY_ENTRY", dateStr, entry }),
    []
  );

  const removeDayEntry = useCallback(
    (dateStr: string, entryId: string) =>
      dispatch({ type: "REMOVE_DAY_ENTRY", dateStr, entryId }),
    []
  );

  const toggleFavorite = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_FAVORITE", id }),
    []
  );

  const isFavorite = useCallback(
    (id: string) => state.favorites.includes(id),
    [state.favorites]
  );

  const toggleDisliked = useCallback(
    (id: string) => dispatch({ type: "TOGGLE_DISLIKED", id }),
    []
  );

  const isDisliked = useCallback(
    (id: string) => state.dislikedRecipes.includes(id),
    [state.dislikedRecipes]
  );

  const addFamilyMember = useCallback(
    (member: FamilyMember) => dispatch({ type: "ADD_FAMILY_MEMBER", member }),
    []
  );

  const removeFamilyMember = useCallback(
    (id: string) => dispatch({ type: "REMOVE_FAMILY_MEMBER", id }),
    []
  );

  const forceSave = useCallback(async () => {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu: state.menu,
        favorites: state.favorites,
        dislikedRecipes: state.dislikedRecipes,
        customRecipes: state.customRecipes,
        manualGroceryItems: state.manualGroceryItems,
        groceryChecked: state.groceryChecked,
        groceryItemStores: state.groceryItemStores,
        familyMembers: state.familyMembers,
        savedMenus: state.savedMenus,
        tips: state.tips,
      }),
    });
  }, [
    state.menu,
    state.favorites,
    state.dislikedRecipes,
    state.customRecipes,
    state.manualGroceryItems,
    state.groceryChecked,
    state.groceryItemStores,
    state.familyMembers,
    state.savedMenus,
    state.tips,
    state.eventPlans,
  ]);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addDayEntry,
        removeDayEntry,
        toggleFavorite,
        isFavorite,
        toggleDisliked,
        isDisliked,
        addFamilyMember,
        removeFamilyMember,
        forceSave,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
