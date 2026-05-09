// ─── Ingredients & Recipes ───────────────────────────────────────────────────

export interface ExtendedIngredient {
  id: number;
  aisle: string;
  name: string;
  nameClean?: string;
  original: string;
  amount: number;
  amountDisplay?: string; // preserves fractions like "1/2" for display/editing
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

// ─── Event Planning ───────────────────────────────────────────────────────────

export interface EventDish {
  id: string;
  title: string;
  recipeId?: string;
  recipeImage?: string;
  recipeUrl?: string;
  customRecipeId?: string;
}

export interface EventTask {
  id: string;
  text: string;
  date?: string;              // ISO date "YYYY-MM-DD" — absolute date
  daysBeforeEvent?: number;   // relative: X days before the event date (0 = day of event)
  time?: string;              // "HH:MM" 24h
  completed: boolean;
  // Optional recipe link
  customRecipeId?: string;
  recipeId?: string;
  recipeTitle?: string;
  recipeImage?: string;
}

export interface EventPlan {
  id: string;
  name: string;
  date: string;   // ISO date of the event
  dishes: EventDish[];
  tasks: EventTask[];
  addedToGroceries: boolean;
  createdAt: string;
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
  manualId?: string;
  store?: string;
  stapleId?: string;
}

export interface ManualGroceryItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  aisle: string;
  checked: boolean;
  store?: string;
  stapleId?: string;
}

export interface StapleItem {
  id: string;
  name: string;
  aisle: string;
  store?: string;
}

export type GroceryListByAisle = Record<string, AggregatedIngredient[]>;

// ─── Family ───────────────────────────────────────────────────────────────────

export interface FamilyMember {
  id: string;          // uuid
  name: string;
  inviteToken: string; // uuid — used as the token in /view/[token]
}

// ─── Cheat Sheets ─────────────────────────────────────────────────────────────

export interface Tip {
  id: string;
  title: string;
  body: string;
  category?: string;
  createdAt: string;
}

// ─── Household & Roles ────────────────────────────────────────────────────────

export type HouseholdRole = "executive-chef" | "sous-chef" | "commensal";

export interface HouseholdMember {
  userId: string;
  email: string;
  name: string;
  role: HouseholdRole;
  joinedAt: string;
}

export interface PendingInvite {
  email: string;
  role: HouseholdRole;
  invitedAt: string;
  invitedBy: string;
}

export interface Household {
  id: string;
  name: string;
  members: HouseholdMember[];
  pendingInvites: PendingInvite[];
  createdAt: string;
  createdBy: string;
}

// ─── Menu Day Meta ────────────────────────────────────────────────────────────

export interface MenuDayMeta {
  isSet: boolean;
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
