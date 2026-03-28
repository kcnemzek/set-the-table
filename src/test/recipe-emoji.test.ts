import { describe, it, expect } from "vitest";
import { getRecipeEmoji, getRecipeCategory } from "@/lib/recipe-emoji";

describe("getRecipeEmoji", () => {
  it("returns pasta emoji for pasta dishes", () => {
    expect(getRecipeEmoji("Spaghetti Carbonara")).toBe("🍝");
  });

  it("returns pizza emoji for pizza", () => {
    expect(getRecipeEmoji("Homemade Pizza")).toBe("🍕");
  });

  it("returns chicken emoji for chicken dishes", () => {
    expect(getRecipeEmoji("Grilled Chicken Breast")).toBe("🍗");
  });

  it("returns burger emoji for burgers", () => {
    expect(getRecipeEmoji("Classic Cheeseburger")).toBe("🍔");
  });

  it("returns salad emoji for salads", () => {
    expect(getRecipeEmoji("Caesar Salad")).toBe("🥗");
  });

  it("returns soup emoji for soups", () => {
    expect(getRecipeEmoji("Tomato Bisque Soup")).toBe("🍲");
  });

  it("returns taco emoji for Mexican dishes", () => {
    expect(getRecipeEmoji("Fish Tacos")).toBe("🌮");
  });

  it("returns fish emoji for fish dishes", () => {
    expect(getRecipeEmoji("Baked Salmon")).toBe("🐟");
  });

  it("returns default plate emoji for unrecognized dishes", () => {
    expect(getRecipeEmoji("Something Totally Unknown")).toBe("🍽️");
  });

  it("is case insensitive", () => {
    expect(getRecipeEmoji("PASTA BOLOGNESE")).toBe("🍝");
    expect(getRecipeEmoji("pasta bolognese")).toBe("🍝");
  });
});

describe("getRecipeCategory", () => {
  it("categorizes pasta correctly", () => {
    const { label, emoji } = getRecipeCategory("Lasagna Bolognese");
    expect(label).toBe("Pasta & Italian");
    expect(emoji).toBe("🍝");
  });

  it("categorizes chicken correctly", () => {
    const { label } = getRecipeCategory("Roasted Chicken Thighs");
    expect(label).toBe("Chicken");
  });

  it("returns Other for unrecognized titles", () => {
    const { label, emoji } = getRecipeCategory("Mystery Dish");
    expect(label).toBe("Other");
    expect(emoji).toBe("🍽️");
  });

  it("is case insensitive", () => {
    const { label } = getRecipeCategory("BEEF STEW");
    expect(label).toBe("Beef");
  });
});
