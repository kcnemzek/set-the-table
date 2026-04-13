import { describe, it, expect } from "vitest";
import { parseIngredientText } from "@/lib/parse-ingredient";

describe("parseIngredientText", () => {
  it("parses a standard ingredient with amount, unit, and name", () => {
    const result = parseIngredientText("2 cups flour");
    expect(result.amount).toBe(2);
    expect(result.amountDisplay).toBe("2");
    expect(result.unit).toBe("cups");
    expect(result.name).toBe("flour");
    expect(result.original).toBe("2 cups flour");
  });

  it("parses a fraction amount", () => {
    const result = parseIngredientText("1/2 tsp salt");
    expect(result.amount).toBe(0.5);
    expect(result.amountDisplay).toBe("1/2");
    expect(result.unit).toBe("tsp");
    expect(result.name).toBe("salt");
  });

  it("parses a mixed number amount", () => {
    const result = parseIngredientText("1 1/2 cups milk");
    expect(result.amount).toBe(1.5);
    expect(result.amountDisplay).toBe("1 1/2");
    expect(result.unit).toBe("cups");
    expect(result.name).toBe("milk");
  });

  it("parses an ingredient with no unit", () => {
    const result = parseIngredientText("3 eggs");
    expect(result.amount).toBe(3);
    expect(result.unit).toBe("");
    expect(result.name).toBe("eggs");
  });

  it("parses an ingredient with no amount", () => {
    const result = parseIngredientText("salt to taste");
    expect(result.amount).toBe(0);
    expect(result.amountDisplay).toBe("");
    expect(result.unit).toBe("");
    expect(result.name).toBe("salt to taste");
  });

  it("handles plural and singular units", () => {
    expect(parseIngredientText("1 tablespoon butter").unit).toBe("tablespoon");
    expect(parseIngredientText("2 tablespoons butter").unit).toBe("tablespoons");
    expect(parseIngredientText("1 oz cheese").unit).toBe("oz");
    expect(parseIngredientText("8 oz cream cheese").unit).toBe("oz");
  });

  it("is case-insensitive for units", () => {
    const result = parseIngredientText("2 Cups sugar");
    expect(result.unit).toBe("Cups");
    expect(result.name).toBe("sugar");
  });

  it("preserves the original string", () => {
    const raw = "1/2 cup brown sugar, packed";
    expect(parseIngredientText(raw).original).toBe(raw);
  });

  it("handles empty string", () => {
    const result = parseIngredientText("");
    expect(result.amount).toBe(0);
    expect(result.name).toBe("");
    expect(result.original).toBe("");
  });

  it("handles multi-word ingredient names", () => {
    const result = parseIngredientText("2 cloves garlic, minced");
    expect(result.unit).toBe("cloves");
    expect(result.name).toBe("garlic, minced");
  });

  it("handles decimal amounts", () => {
    const result = parseIngredientText("0.5 lb ground beef");
    expect(result.amount).toBe(0.5);
    expect(result.unit).toBe("lb");
    expect(result.name).toBe("ground beef");
  });
});
