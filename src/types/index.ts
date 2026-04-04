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
  url?: string;
  category?: string; // overrides auto-detection from title
  emoji?: string;    // overrides auto-detection from title/category
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

/** A single entry on a day — either an Edamam/custom recipe, free text, or a special event/occasion */
export interface DayEntry {
  id: string; // uuid
  type: "recipe" | "custom-recipe" | "text" | "event";
  // type === "recipe"
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string;
  recipeUrl?: string;
  // type === "custom-recipe"
  customRecipeId?: string;
  // type === "text"
  text?: string;
  url?: string;
}

/** Menu keyed by "YYYY-MM-DD" → ordered list of entries */
export type Menu = Record<string, DayEntry[]>;

/** A named snapshot of a day's entries that can be reused */
export interface SavedMenu {
  id: string;
  name: string;
  entries: DayEntry[];
  createdAt: string; // ISO date string
}

// ─── Grocery ──────────────────────────────────────────────────────────────────

export interface AggregatedIngredient {
  name: string;
  totalAmount: number;
  unit: string;
  aisle: string;
  originalLines: string[];
  checked: boolean;
  recipes: string[];
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

// ─── Tips ─────────────────────────────────────────────────────────────────────

export interface Tip {
  id: string;
  title: string;
  body: string;
  category?: string;
  createdAt: string;
}

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
