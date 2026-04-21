import type { RecipeSummary, RecipeDetail, ExtendedIngredient } from "@/types";

export function extractId(uri: string): string {
  return uri.split("#recipe_")[1] ?? uri;
}

function toAisle(foodCategory?: string): string {
  if (!foodCategory) return "Miscellaneous";
  const map: Record<string, string> = {
    vegetables: "Produce",
    fruit: "Produce",
    produce: "Produce",
    grains: "Grains & Pasta",
    pasta: "Grains & Pasta",
    cereal: "Grains & Pasta",
    bread: "Bakery",
    pastry: "Bakery",
    "quick bread": "Bakery",
    muffin: "Bakery",
    bagel: "Bakery",
    roll: "Bakery",
    croissant: "Bakery",
    "baked goods": "Bakery",
    meat: "Meat & Seafood",
    seafood: "Meat & Seafood",
    poultry: "Meat & Seafood",
    fish: "Meat & Seafood",
    dairy: "Dairy",
    egg: "Dairy",
    cheese: "Dairy",
    milk: "Dairy",
    "oils and fats": "Oils & Condiments",
    "condiments and sauces": "Oils & Condiments",
    oil: "Oils & Condiments",
    sauce: "Oils & Condiments",
    vinegar: "Oils & Condiments",
    beverages: "Beverages",
    alcohol: "Beverages",
    wine: "Beverages",
    beer: "Beverages",
    juice: "Beverages",
    baking: "Baking",
    sugar: "Baking",
    sweets: "Baking",
    "spices and herbs": "Spices & Herbs",
    spice: "Spices & Herbs",
    herb: "Spices & Herbs",
    legumes: "Canned & Dry Goods",
    beans: "Canned & Dry Goods",
    canned: "Canned & Dry Goods",
    "nuts and seeds": "Nuts & Snacks",
    nuts: "Nuts & Snacks",
    snacks: "Nuts & Snacks",
    frozen: "Frozen",
  };
  const lower = foodCategory.toLowerCase();
  for (const [key, label] of Object.entries(map)) {
    if (lower.includes(key)) return label;
  }
  return "Miscellaneous";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface EdamamIngredient {
  text: string;
  quantity: number;
  measure: string;
  food: string;
  weight: number;
  foodCategory?: string;
}

interface EdamamRecipe {
  uri: string;
  label: string;
  image?: string;
  images?: { REGULAR?: { url: string }; SMALL?: { url: string } };
  url?: string;
  source?: string;
  yield?: number;
  totalTime?: number;
  cuisineType?: string[];
  mealType?: string[];
  dishType?: string[];
  dietLabels?: string[];
  healthLabels?: string[];
  ingredients?: EdamamIngredient[];
}

export function transformRecipe(recipe: EdamamRecipe): RecipeDetail {
  const id = extractId(recipe.uri);
  const healthLabels = recipe.healthLabels?.map((h) => h.toLowerCase()) ?? [];
  const image =
    recipe.images?.REGULAR?.url ?? recipe.images?.SMALL?.url ?? recipe.image ?? "";

  const extendedIngredients: ExtendedIngredient[] = (recipe.ingredients ?? []).map((ing, idx) => ({
    id: idx,
    aisle: toAisle(ing.foodCategory),
    name: ing.food,
    nameClean: ing.food,
    original: ing.text,
    amount: ing.quantity ?? 0,
    unit: ing.measure ?? "",
  }));

  return {
    id,
    title: recipe.label,
    image,
    readyInMinutes: recipe.totalTime ?? 0,
    servings: recipe.yield ?? 1,
    vegetarian: healthLabels.includes("vegetarian"),
    vegan: healthLabels.includes("vegan"),
    glutenFree: healthLabels.includes("gluten-free"),
    dairyFree: healthLabels.includes("dairy-free"),
    cuisines: recipe.cuisineType?.map(capitalize),
    diets: recipe.dietLabels,
    dishTypes: recipe.dishType,
    sourceUrl: recipe.url,
    creditsText: recipe.source,
    extendedIngredients,
  };
}

export function transformHit(hit: { recipe: EdamamRecipe }): RecipeSummary {
  const r = hit.recipe;
  const id = extractId(r.uri);
  const healthLabels = r.healthLabels?.map((h) => h.toLowerCase()) ?? [];
  const image = r.images?.REGULAR?.url ?? r.images?.SMALL?.url ?? r.image ?? "";

  return {
    id,
    title: r.label,
    image,
    readyInMinutes: r.totalTime ?? 0,
    servings: r.yield ?? 1,
    vegetarian: healthLabels.includes("vegetarian"),
    vegan: healthLabels.includes("vegan"),
    glutenFree: healthLabels.includes("gluten-free"),
    dairyFree: healthLabels.includes("dairy-free"),
    cuisines: r.cuisineType?.map(capitalize),
    diets: r.dietLabels,
    dishTypes: r.dishType,
    sourceUrl: r.url,
  };
}
