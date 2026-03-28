import { describe, it, expect } from "vitest";
import { aggregateIngredients, groceryItemKey } from "@/lib/ingredient-utils";
import type { RecipeDetail, ManualGroceryItem } from "@/types";

function makeRecipe(ingredients: Partial<RecipeDetail["extendedIngredients"][0]>[]): RecipeDetail {
  return {
    id: "1",
    title: "Test Recipe",
    image: "",
    readyInMinutes: 30,
    servings: 4,
    extendedIngredients: ingredients.map((ing, i) => ({
      id: i,
      aisle: "Produce",
      name: "ingredient",
      amount: 1,
      unit: "cup",
      original: "1 cup ingredient",
      ...ing,
    })),
  };
}

describe("aggregateIngredients", () => {
  it("returns empty object for no recipes", () => {
    expect(aggregateIngredients([], [])).toEqual({});
  });

  it("groups ingredients by aisle", () => {
    const recipe = makeRecipe([
      { name: "apple", aisle: "Produce", amount: 2, unit: "each", original: "2 apples" },
      { name: "milk", aisle: "Dairy", amount: 1, unit: "cup", original: "1 cup milk" },
    ]);
    const result = aggregateIngredients([recipe], []);
    expect(Object.keys(result)).toContain("Produce");
    expect(Object.keys(result)).toContain("Dairy");
  });

  it("sums amounts for the same ingredient and unit", () => {
    const recipe1 = makeRecipe([{ name: "flour", nameClean: "flour", aisle: "Baking", amount: 2, unit: "cup", original: "2 cups flour" }]);
    const recipe2 = makeRecipe([{ name: "flour", nameClean: "flour", aisle: "Baking", amount: 1, unit: "cup", original: "1 cup flour" }]);
    const result = aggregateIngredients([recipe1, recipe2], []);
    const flourItem = result["Baking"]?.find((i) => i.name === "flour");
    expect(flourItem?.totalAmount).toBe(3);
  });

  it("keeps separate entries for same ingredient with different units", () => {
    const recipe = makeRecipe([
      { name: "sugar", nameClean: "sugar", aisle: "Baking", amount: 1, unit: "cup", original: "1 cup sugar" },
      { name: "sugar", nameClean: "sugar", aisle: "Baking", amount: 2, unit: "tbsp", original: "2 tbsp sugar" },
    ]);
    const result = aggregateIngredients([recipe], []);
    const sugarItems = result["Baking"]?.filter((i) => i.name === "sugar");
    expect(sugarItems).toHaveLength(2);
  });

  it("sorts items alphabetically within each aisle", () => {
    const recipe = makeRecipe([
      { name: "zucchini", aisle: "Produce", amount: 1, unit: "", original: "1 zucchini" },
      { name: "apple", aisle: "Produce", amount: 1, unit: "", original: "1 apple" },
      { name: "mango", aisle: "Produce", amount: 1, unit: "", original: "1 mango" },
    ]);
    const result = aggregateIngredients([recipe], []);
    const names = result["Produce"]?.map((i) => i.name);
    expect(names).toEqual([...names!].sort());
  });

  it("puts Miscellaneous aisle last", () => {
    const recipe = makeRecipe([
      { name: "apple", aisle: "Produce", amount: 1, unit: "", original: "1 apple" },
      { name: "thing", aisle: "Miscellaneous", amount: 1, unit: "", original: "1 thing" },
    ]);
    const result = aggregateIngredients([recipe], []);
    const aisles = Object.keys(result);
    expect(aisles[aisles.length - 1]).toBe("Miscellaneous");
  });

  it("includes manual grocery items under their aisle", () => {
    const manual: ManualGroceryItem = {
      id: "m1",
      name: "Paper Towels",
      amount: 1,
      unit: "roll",
      aisle: "Household",
      checked: false,
    };
    const result = aggregateIngredients([], [manual]);
    expect(result["Household"]).toHaveLength(1);
    expect(result["Household"][0].name).toBe("Paper Towels");
  });

  it("uses nameClean over name when available", () => {
    const recipe = makeRecipe([
      { name: "tomatoes, diced", nameClean: "tomato", aisle: "Produce", amount: 1, unit: "cup", original: "1 cup diced tomatoes" },
    ]);
    const result = aggregateIngredients([recipe], []);
    const item = result["Produce"]?.find((i) => i.name === "tomato");
    expect(item).toBeDefined();
  });
});

describe("groceryItemKey", () => {
  it("generates a stable key from aisle, name, and unit", () => {
    expect(groceryItemKey("Produce", "Apples", "each")).toBe("Produce|apples|each");
  });

  it("lowercases name and unit", () => {
    expect(groceryItemKey("Dairy", "MILK", "CUP")).toBe("Dairy|milk|cup");
  });

  it("produces the same key for the same inputs", () => {
    const key1 = groceryItemKey("Baking", "flour", "cup");
    const key2 = groceryItemKey("Baking", "flour", "cup");
    expect(key1).toBe(key2);
  });

  it("produces different keys for different units", () => {
    const key1 = groceryItemKey("Baking", "sugar", "cup");
    const key2 = groceryItemKey("Baking", "sugar", "tbsp");
    expect(key1).not.toBe(key2);
  });
});
