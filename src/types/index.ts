// ─── Ingredients & Recipes ───────────────────────────────────────────────────

export interface ExtendedIngredient {
  id: number;
  aisle: string;
  name: string;
  nameClean?: string;
  original: string;
  amount: number;
  unit: string;
}

export interface RecipeSummary {
  id: string;
  title: string;
  image: string;
  readyInMinutes: number;
  servings: number;
  vegetarian?: boolean;
  vegan?: boolean;
  glutenFree?: boolean;
  dairyFree?: boolean;
  cuisines?: string[];
  diets?: string[];
  dishTypes?: string[];
  sourceUrl?: string;
}

export interface RecipeDetail extends RecipeSummary {
  extendedIngredients: ExtendedIngredient[];
  creditsText?: string;
}

// ─── Custom Recipes ───────────────────────────────────────────────────────────

export interface CustomRecipe {
  id: string; // prefixed "custom_" + uuid
  title: string;
  servings: number;
  extendedIngredients: ExtendedIngredient[];
  directions?: string;
  notes?: string;
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

/** A single entry on a day — either an Edamam/custom recipe or free text */
export interface DayEntry {
  id: string; // uuid
  type: "recipe" | "custom-recipe" | "text";
  // type === "recipe"
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string;
  recipeUrl?: string;
  // type === "custom-recipe"
  customRecipeId?: string;
  // type === "text"
  text?: string;
}

/** Menu keyed by "YYYY-MM-DD" → ordered list of entries */
export type Menu = Record<string, DayEntry[]>;

// ─── Grocery ──────────────────────────────────────────────────────────────────

export interface AggregatedIngredient {
  name: string;
  totalAmount: number;
  unit: string;
  aisle: string;
  originalLines: string[];
  checked: boolean;
}

export interface ManualGroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
  checked: boolean;
}

export type GroceryListByAisle = Record<string, AggregatedIngredient[]>;

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  cuisine: string;
  diet: string;
  type: string;
  nextPageToken?: string;
}

export interface SearchResult {
  results: RecipeSummary[];
  totalResults: number;
  nextPageToken?: string;
}
