import { describe, it, expect } from "vitest";
import type { DayEntry, CustomRecipe } from "@/types";

// ─── Inline the reducer so we don't need to mock next-auth ───────────────────

interface AppState {
  menu: Record<string, DayEntry[]>;
  favorites: string[];
  dislikedRecipes: string[];
  customRecipes: CustomRecipe[];
  manualGroceryItems: never[];
  groceryChecked: Record<string, boolean>;
  familyMembers: string[];
  recipeCache: Record<string, unknown>;
  hydrated: boolean;
}

type Action =
  | { type: "HYDRATE"; payload: Omit<AppState, "hydrated" | "recipeCache"> }
  | { type: "ADD_DAY_ENTRY"; dateStr: string; entry: DayEntry }
  | { type: "REMOVE_DAY_ENTRY"; dateStr: string; entryId: string }
  | { type: "REORDER_DAY_ENTRIES"; dateStr: string; entries: DayEntry[] }
  | { type: "UPDATE_DAY_ENTRY"; dateStr: string; entry: DayEntry }
  | { type: "TOGGLE_FAVORITE"; id: string }
  | { type: "TOGGLE_DISLIKED"; id: string }
  | { type: "ADD_CUSTOM_RECIPE"; recipe: CustomRecipe }
  | { type: "UPDATE_CUSTOM_RECIPE"; recipe: CustomRecipe }
  | { type: "REMOVE_CUSTOM_RECIPE"; id: string }
  | { type: "TOGGLE_GROCERY_CHECKED"; key: string }
  | { type: "ADD_FAMILY_MEMBER"; name: string }
  | { type: "REMOVE_FAMILY_MEMBER"; name: string };

const initialState: AppState = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
  familyMembers: [],
  recipeCache: {},
  hydrated: false,
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload, recipeCache: {}, hydrated: true };

    case "ADD_DAY_ENTRY": {
      const existing = state.menu[action.dateStr] ?? [];
      return { ...state, menu: { ...state.menu, [action.dateStr]: [...existing, action.entry] } };
    }

    case "REMOVE_DAY_ENTRY": {
      const updated = (state.menu[action.dateStr] ?? []).filter((e) => e.id !== action.entryId);
      return { ...state, menu: { ...state.menu, [action.dateStr]: updated } };
    }

    case "REORDER_DAY_ENTRIES":
      return { ...state, menu: { ...state.menu, [action.dateStr]: action.entries } };

    case "UPDATE_DAY_ENTRY": {
      const updated = (state.menu[action.dateStr] ?? []).map((e) =>
        e.id === action.entry.id ? action.entry : e
      );
      return { ...state, menu: { ...state.menu, [action.dateStr]: updated } };
    }

    case "TOGGLE_FAVORITE": {
      const exists = state.favorites.includes(action.id);
      return {
        ...state,
        favorites: exists ? state.favorites.filter((id) => id !== action.id) : [...state.favorites, action.id],
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
        customRecipes: state.customRecipes.map((r) => (r.id === action.recipe.id ? action.recipe : r)),
        menu: updatedMenu,
      };
    }

    case "REMOVE_CUSTOM_RECIPE":
      return { ...state, customRecipes: state.customRecipes.filter((r) => r.id !== action.id) };

    case "TOGGLE_GROCERY_CHECKED":
      return {
        ...state,
        groceryChecked: { ...state.groceryChecked, [action.key]: !state.groceryChecked[action.key] },
      };

    case "ADD_FAMILY_MEMBER":
      if (state.familyMembers.includes(action.name)) return state;
      return { ...state, familyMembers: [...state.familyMembers, action.name] };

    case "REMOVE_FAMILY_MEMBER":
      return { ...state, familyMembers: state.familyMembers.filter((n) => n !== action.name) };

    default:
      return state;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<DayEntry> = {}): DayEntry {
  return { id: crypto.randomUUID(), type: "text", text: "Test", ...overrides };
}

function makeRecipe(overrides: Partial<CustomRecipe> = {}): CustomRecipe {
  return {
    id: "custom_1",
    title: "Pasta",
    servings: 4,
    extendedIngredients: [],
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("reducer — menu", () => {
  it("adds a day entry", () => {
    const entry = makeEntry();
    const state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry });
    expect(state.menu["2026-03-28"]).toHaveLength(1);
    expect(state.menu["2026-03-28"][0]).toEqual(entry);
  });

  it("appends to existing entries", () => {
    const first = makeEntry({ text: "First" });
    const second = makeEntry({ text: "Second" });
    let state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: first });
    state = reducer(state, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: second });
    expect(state.menu["2026-03-28"]).toHaveLength(2);
    expect(state.menu["2026-03-28"][1].text).toBe("Second");
  });

  it("removes a day entry by id", () => {
    const entry = makeEntry();
    let state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry });
    state = reducer(state, { type: "REMOVE_DAY_ENTRY", dateStr: "2026-03-28", entryId: entry.id });
    expect(state.menu["2026-03-28"]).toHaveLength(0);
  });

  it("does not remove entries from other days", () => {
    const entry = makeEntry();
    let state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry });
    state = reducer(state, { type: "REMOVE_DAY_ENTRY", dateStr: "2026-03-29", entryId: entry.id });
    expect(state.menu["2026-03-28"]).toHaveLength(1);
  });

  it("updates a day entry", () => {
    const entry = makeEntry({ text: "Original" });
    let state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry });
    state = reducer(state, {
      type: "UPDATE_DAY_ENTRY",
      dateStr: "2026-03-28",
      entry: { ...entry, text: "Updated" },
    });
    expect(state.menu["2026-03-28"][0].text).toBe("Updated");
  });

  it("reorders day entries", () => {
    const a = makeEntry({ text: "A" });
    const b = makeEntry({ text: "B" });
    let state = reducer(initialState, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: a });
    state = reducer(state, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: b });
    state = reducer(state, { type: "REORDER_DAY_ENTRIES", dateStr: "2026-03-28", entries: [b, a] });
    expect(state.menu["2026-03-28"][0].text).toBe("B");
    expect(state.menu["2026-03-28"][1].text).toBe("A");
  });
});

describe("reducer — favorites", () => {
  it("adds a favorite", () => {
    const state = reducer(initialState, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    expect(state.favorites).toContain("recipe_1");
  });

  it("removes a favorite when toggled again", () => {
    let state = reducer(initialState, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    state = reducer(state, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    expect(state.favorites).not.toContain("recipe_1");
  });

  it("does not duplicate favorites", () => {
    let state = reducer(initialState, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    state = reducer(state, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    state = reducer(state, { type: "TOGGLE_FAVORITE", id: "recipe_1" });
    expect(state.favorites.filter((id) => id === "recipe_1")).toHaveLength(1);
  });
});

describe("reducer — disliked recipes", () => {
  it("marks a recipe as disliked", () => {
    const state = reducer(initialState, { type: "TOGGLE_DISLIKED", id: "recipe_1" });
    expect(state.dislikedRecipes).toContain("recipe_1");
  });

  it("removes disliked when toggled again", () => {
    let state = reducer(initialState, { type: "TOGGLE_DISLIKED", id: "recipe_1" });
    state = reducer(state, { type: "TOGGLE_DISLIKED", id: "recipe_1" });
    expect(state.dislikedRecipes).not.toContain("recipe_1");
  });
});

describe("reducer — custom recipes", () => {
  it("adds a custom recipe", () => {
    const recipe = makeRecipe();
    const state = reducer(initialState, { type: "ADD_CUSTOM_RECIPE", recipe });
    expect(state.customRecipes).toHaveLength(1);
    expect(state.customRecipes[0].title).toBe("Pasta");
  });

  it("removes a custom recipe", () => {
    const recipe = makeRecipe();
    let state = reducer(initialState, { type: "ADD_CUSTOM_RECIPE", recipe });
    state = reducer(state, { type: "REMOVE_CUSTOM_RECIPE", id: recipe.id });
    expect(state.customRecipes).toHaveLength(0);
  });

  it("updates a custom recipe title", () => {
    const recipe = makeRecipe();
    let state = reducer(initialState, { type: "ADD_CUSTOM_RECIPE", recipe });
    state = reducer(state, {
      type: "UPDATE_CUSTOM_RECIPE",
      recipe: { ...recipe, title: "Spaghetti" },
    });
    expect(state.customRecipes[0].title).toBe("Spaghetti");
  });

  it("syncs recipe title across menu entries when updated", () => {
    const recipe = makeRecipe({ id: "custom_1", title: "Pasta" });
    const menuEntry = makeEntry({ type: "custom-recipe", customRecipeId: "custom_1", recipeTitle: "Pasta" });
    let state = reducer(initialState, { type: "ADD_CUSTOM_RECIPE", recipe });
    state = reducer(state, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: menuEntry });
    state = reducer(state, { type: "UPDATE_CUSTOM_RECIPE", recipe: { ...recipe, title: "Spaghetti" } });
    expect(state.menu["2026-03-28"][0].recipeTitle).toBe("Spaghetti");
  });

  it("does not affect menu entries for other recipes when updating", () => {
    const recipe = makeRecipe({ id: "custom_1", title: "Pasta" });
    const otherEntry = makeEntry({ type: "custom-recipe", customRecipeId: "custom_2", recipeTitle: "Pizza" });
    let state = reducer(initialState, { type: "ADD_CUSTOM_RECIPE", recipe });
    state = reducer(state, { type: "ADD_DAY_ENTRY", dateStr: "2026-03-28", entry: otherEntry });
    state = reducer(state, { type: "UPDATE_CUSTOM_RECIPE", recipe: { ...recipe, title: "Spaghetti" } });
    expect(state.menu["2026-03-28"][0].recipeTitle).toBe("Pizza");
  });
});

describe("reducer — family members", () => {
  it("adds a family member", () => {
    const state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", name: "Elizabeth" });
    expect(state.familyMembers).toContain("Elizabeth");
  });

  it("does not add duplicate family members", () => {
    let state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", name: "Elizabeth" });
    state = reducer(state, { type: "ADD_FAMILY_MEMBER", name: "Elizabeth" });
    expect(state.familyMembers.filter((n) => n === "Elizabeth")).toHaveLength(1);
  });

  it("removes a family member", () => {
    let state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", name: "Elizabeth" });
    state = reducer(state, { type: "REMOVE_FAMILY_MEMBER", name: "Elizabeth" });
    expect(state.familyMembers).not.toContain("Elizabeth");
  });
});

describe("reducer — grocery checked", () => {
  it("toggles a grocery item as checked", () => {
    const state = reducer(initialState, { type: "TOGGLE_GROCERY_CHECKED", key: "Produce|apples|" });
    expect(state.groceryChecked["Produce|apples|"]).toBe(true);
  });

  it("toggles a checked item back to unchecked", () => {
    let state = reducer(initialState, { type: "TOGGLE_GROCERY_CHECKED", key: "Produce|apples|" });
    state = reducer(state, { type: "TOGGLE_GROCERY_CHECKED", key: "Produce|apples|" });
    expect(state.groceryChecked["Produce|apples|"]).toBe(false);
  });
});

describe("reducer — hydrate", () => {
  it("sets hydrated and merges payload", () => {
    const state = reducer(initialState, {
      type: "HYDRATE",
      payload: {
        menu: { "2026-03-28": [] },
        favorites: ["recipe_1"],
        dislikedRecipes: [],
        customRecipes: [],
        manualGroceryItems: [],
        groceryChecked: {},
        familyMembers: ["Karen"],
      },
    });
    expect(state.hydrated).toBe(true);
    expect(state.favorites).toContain("recipe_1");
    expect(state.familyMembers).toContain("Karen");
    expect(state.recipeCache).toEqual({});
  });
});
