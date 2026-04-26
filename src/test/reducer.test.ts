import { describe, it, expect } from "vitest";
import type { DayEntry, CustomRecipe, Tip, FamilyMember, EventDish, EventTask, EventPlan } from "@/types";

// ─── Inline the reducer so we don't need to mock next-auth ───────────────────

interface AppState {
  menu: Record<string, DayEntry[]>;
  favorites: string[];
  dislikedRecipes: string[];
  customRecipes: CustomRecipe[];
  manualGroceryItems: never[];
  groceryChecked: Record<string, boolean>;
  familyMembers: FamilyMember[];
  tips: Tip[];
  eventPlans: EventPlan[];
  menuDayMeta: Record<string, { isSet: boolean }>;
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
  | { type: "ADD_FAMILY_MEMBER"; member: FamilyMember }
  | { type: "REMOVE_FAMILY_MEMBER"; id: string }
  | { type: "ADD_TIP"; tip: Tip }
  | { type: "UPDATE_TIP"; tip: Tip }
  | { type: "DELETE_TIP"; id: string }
  | { type: "REORDER_EVENT_DISHES"; planId: string; dishes: EventDish[] }
  | { type: "REORDER_EVENT_TASKS"; planId: string; tasks: EventTask[] }
  | { type: "SET_DAY_META"; dateStr: string; meta: { isSet: boolean } };

const initialState: AppState = {
  menu: {},
  favorites: [],
  dislikedRecipes: [],
  customRecipes: [],
  manualGroceryItems: [],
  groceryChecked: {},
  familyMembers: [],
  tips: [],
  eventPlans: [],
  menuDayMeta: {},
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
      if (state.familyMembers.some((m) => m.id === action.member.id)) return state;
      return { ...state, familyMembers: [...state.familyMembers, action.member] };

    case "REMOVE_FAMILY_MEMBER":
      return { ...state, familyMembers: state.familyMembers.filter((m) => m.id !== action.id) };

    case "ADD_TIP":
      return { ...state, tips: [...state.tips, action.tip] };

    case "UPDATE_TIP":
      return { ...state, tips: state.tips.map((t) => t.id === action.tip.id ? action.tip : t) };

    case "DELETE_TIP":
      return { ...state, tips: state.tips.filter((t) => t.id !== action.id) };

    case "REORDER_EVENT_DISHES":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, dishes: action.dishes } : p) };

    case "REORDER_EVENT_TASKS":
      return { ...state, eventPlans: state.eventPlans.map((p) => p.id === action.planId ? { ...p, tasks: action.tasks } : p) };

    case "SET_DAY_META":
      return { ...state, menuDayMeta: { ...state.menuDayMeta, [action.dateStr]: action.meta } };

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

function makeTip(overrides: Partial<Tip> = {}): Tip {
  return {
    id: crypto.randomUUID(),
    title: "How to poach chicken",
    body: "Simmer at 160°F for 15 minutes.",
    createdAt: new Date().toISOString(),
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

function makeMember(overrides: Partial<FamilyMember> = {}): FamilyMember {
  return {
    id: crypto.randomUUID(),
    name: "Elizabeth",
    inviteToken: crypto.randomUUID(),
    ...overrides,
  };
}

describe("reducer — family members", () => {
  it("adds a family member", () => {
    const member = makeMember();
    const state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", member });
    expect(state.familyMembers).toHaveLength(1);
    expect(state.familyMembers[0].name).toBe("Elizabeth");
  });

  it("does not add duplicate family members (same id)", () => {
    const member = makeMember({ id: "fixed-id" });
    let state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", member });
    state = reducer(state, { type: "ADD_FAMILY_MEMBER", member });
    expect(state.familyMembers.filter((m) => m.id === "fixed-id")).toHaveLength(1);
  });

  it("removes a family member by id", () => {
    const member = makeMember();
    let state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", member });
    state = reducer(state, { type: "REMOVE_FAMILY_MEMBER", id: member.id });
    expect(state.familyMembers).toHaveLength(0);
  });

  it("does not remove other family members", () => {
    const a = makeMember({ id: "id-a", name: "Alice" });
    const b = makeMember({ id: "id-b", name: "Bob" });
    let state = reducer(initialState, { type: "ADD_FAMILY_MEMBER", member: a });
    state = reducer(state, { type: "ADD_FAMILY_MEMBER", member: b });
    state = reducer(state, { type: "REMOVE_FAMILY_MEMBER", id: "id-a" });
    expect(state.familyMembers).toHaveLength(1);
    expect(state.familyMembers[0].name).toBe("Bob");
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

describe("reducer — tips", () => {
  it("adds a tip", () => {
    const tip = makeTip();
    const state = reducer(initialState, { type: "ADD_TIP", tip });
    expect(state.tips).toHaveLength(1);
    expect(state.tips[0].title).toBe("How to poach chicken");
  });

  it("updates a tip", () => {
    const tip = makeTip();
    let state = reducer(initialState, { type: "ADD_TIP", tip });
    state = reducer(state, { type: "UPDATE_TIP", tip: { ...tip, title: "How to poach salmon" } });
    expect(state.tips[0].title).toBe("How to poach salmon");
    expect(state.tips).toHaveLength(1);
  });

  it("does not affect other tips when updating", () => {
    const tip1 = makeTip({ id: "tip_1", title: "Tip One" });
    const tip2 = makeTip({ id: "tip_2", title: "Tip Two" });
    let state = reducer(initialState, { type: "ADD_TIP", tip: tip1 });
    state = reducer(state, { type: "ADD_TIP", tip: tip2 });
    state = reducer(state, { type: "UPDATE_TIP", tip: { ...tip1, title: "Updated One" } });
    expect(state.tips.find((t) => t.id === "tip_2")?.title).toBe("Tip Two");
  });

  it("deletes a tip by id", () => {
    const tip = makeTip();
    let state = reducer(initialState, { type: "ADD_TIP", tip });
    state = reducer(state, { type: "DELETE_TIP", id: tip.id });
    expect(state.tips).toHaveLength(0);
  });

  it("does not delete other tips when deleting one", () => {
    const tip1 = makeTip({ id: "tip_1" });
    const tip2 = makeTip({ id: "tip_2" });
    let state = reducer(initialState, { type: "ADD_TIP", tip: tip1 });
    state = reducer(state, { type: "ADD_TIP", tip: tip2 });
    state = reducer(state, { type: "DELETE_TIP", id: "tip_1" });
    expect(state.tips).toHaveLength(1);
    expect(state.tips[0].id).toBe("tip_2");
  });
});

function makeDish(overrides: Partial<EventDish> = {}): EventDish {
  return { id: crypto.randomUUID(), title: "Roast Turkey", ...overrides };
}

function makeTask(overrides: Partial<EventTask> = {}): EventTask {
  return { id: crypto.randomUUID(), text: "Brine turkey", completed: false, date: "2026-11-26", daysBeforeEvent: 1, ...overrides };
}

function makePlan(overrides: Partial<EventPlan> = {}): EventPlan {
  return {
    id: crypto.randomUUID(),
    name: "Thanksgiving",
    date: "2026-11-27",
    dishes: [],
    tasks: [],
    addedToGroceries: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function stateWithPlan(plan: EventPlan): AppState {
  return { ...initialState, eventPlans: [plan] };
}

describe("reducer — event plan reordering", () => {
  it("reorders dishes within a plan", () => {
    const a = makeDish({ title: "Appetizer" });
    const b = makeDish({ title: "Main" });
    const c = makeDish({ title: "Dessert" });
    const plan = makePlan({ dishes: [a, b, c] });
    const state = reducer(stateWithPlan(plan), {
      type: "REORDER_EVENT_DISHES",
      planId: plan.id,
      dishes: [c, a, b],
    });
    const dishes = state.eventPlans[0].dishes;
    expect(dishes[0].title).toBe("Dessert");
    expect(dishes[1].title).toBe("Appetizer");
    expect(dishes[2].title).toBe("Main");
  });

  it("does not affect other plans when reordering dishes", () => {
    const plan1 = makePlan({ id: "plan-1", dishes: [makeDish({ title: "A" }), makeDish({ title: "B" })] });
    const plan2 = makePlan({ id: "plan-2", dishes: [makeDish({ title: "C" })] });
    const state = reducer({ ...initialState, eventPlans: [plan1, plan2] }, {
      type: "REORDER_EVENT_DISHES",
      planId: "plan-1",
      dishes: [plan1.dishes[1], plan1.dishes[0]],
    });
    expect(state.eventPlans.find((p) => p.id === "plan-2")!.dishes[0].title).toBe("C");
  });

  it("reorders tasks within a plan", () => {
    const t1 = makeTask({ text: "Brine" });
    const t2 = makeTask({ text: "Thaw" });
    const plan = makePlan({ tasks: [t1, t2] });
    const state = reducer(stateWithPlan(plan), {
      type: "REORDER_EVENT_TASKS",
      planId: plan.id,
      tasks: [t2, t1],
    });
    const tasks = state.eventPlans[0].tasks;
    expect(tasks[0].text).toBe("Thaw");
    expect(tasks[1].text).toBe("Brine");
  });

  it("does not affect other plans when reordering tasks", () => {
    const plan1 = makePlan({ id: "plan-1", tasks: [makeTask({ text: "X" }), makeTask({ text: "Y" })] });
    const plan2 = makePlan({ id: "plan-2", tasks: [makeTask({ text: "Z" })] });
    const state = reducer({ ...initialState, eventPlans: [plan1, plan2] }, {
      type: "REORDER_EVENT_TASKS",
      planId: "plan-1",
      tasks: [plan1.tasks[1], plan1.tasks[0]],
    });
    expect(state.eventPlans.find((p) => p.id === "plan-2")!.tasks[0].text).toBe("Z");
  });
});

describe("reducer — menuDayMeta", () => {
  it("sets isSet true for a date", () => {
    const state = reducer(initialState, {
      type: "SET_DAY_META",
      dateStr: "2026-04-26",
      meta: { isSet: true },
    });
    expect(state.menuDayMeta["2026-04-26"]).toEqual({ isSet: true });
  });

  it("sets isSet false for a date", () => {
    let state = reducer(initialState, { type: "SET_DAY_META", dateStr: "2026-04-26", meta: { isSet: true } });
    state = reducer(state, { type: "SET_DAY_META", dateStr: "2026-04-26", meta: { isSet: false } });
    expect(state.menuDayMeta["2026-04-26"]).toEqual({ isSet: false });
  });

  it("does not affect other dates when setting meta", () => {
    let state = reducer(initialState, { type: "SET_DAY_META", dateStr: "2026-04-26", meta: { isSet: true } });
    state = reducer(state, { type: "SET_DAY_META", dateStr: "2026-04-27", meta: { isSet: true } });
    state = reducer(state, { type: "SET_DAY_META", dateStr: "2026-04-26", meta: { isSet: false } });
    expect(state.menuDayMeta["2026-04-27"]).toEqual({ isSet: true });
  });

  it("starts with empty menuDayMeta", () => {
    expect(initialState.menuDayMeta).toEqual({});
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
        familyMembers: [{ id: "m1", name: "Karen", inviteToken: "tok-1" }],
        tips: [],
        eventPlans: [],
        menuDayMeta: { "2026-03-28": { isSet: true } },
      },
    });
    expect(state.hydrated).toBe(true);
    expect(state.favorites).toContain("recipe_1");
    expect(state.familyMembers[0].name).toBe("Karen");
    expect(state.menuDayMeta["2026-03-28"]).toEqual({ isSet: true });
    expect(state.recipeCache).toEqual({});
  });
});
