# Mom, What's for Dinner? — Architecture

## Table of Contents
1. [Stack](#1-stack)
2. [Data Schema](#2-data-schema)
3. [State Management](#3-state-management)
4. [Routing & Navigation](#4-routing--navigation)
5. [Authentication](#5-authentication)
6. [API Layer](#6-api-layer)
7. [Data Persistence](#7-data-persistence)
8. [External Services](#8-external-services)
9. [Component Tree](#9-component-tree)
10. [Environment Variables](#10-environment-variables)

---

## 1. Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + Tailwind CSS 3.4 |
| Language | TypeScript 5 |
| Auth | NextAuth.js v5 (Google OAuth) |
| State | React Context + useReducer |
| Storage | Vercel KV (Redis) / filesystem fallback |
| Recipes API | Edamam Recipe Search v2 |
| Drag & Drop | dnd-kit |
| Icons | lucide-react |
| Analytics | Vercel Analytics |
| Testing | Vitest + Testing Library |
| Hosting | Vercel |

---

## 2. Data Schema

All data is schema-less JSON stored in key-value storage. No traditional database.

### Recipe Types

```typescript
RecipeSummary {
  id: string
  title: string
  image: string
  readyInMinutes: number
  servings: number
  // dietary flags: vegetarian, vegan, glutenFree, dairyFree
}

RecipeDetail extends RecipeSummary {
  extendedIngredients: ExtendedIngredient[]
  creditsText: string
}

ExtendedIngredient {
  id: number
  name: string
  aisle: string
  amount: number
  unit: string
}

CustomRecipe {
  id: string                    // prefixed "custom_"
  title: string
  category?: string
  servings?: number
  extendedIngredients: ExtendedIngredient[]
  directions?: string
  notes?: string
  url?: string
  emoji?: string
}
```

### Menu Types

```typescript
DayEntry {
  id: string
  type: "recipe" | "custom-recipe" | "text" | "event"
  // recipe / custom-recipe fields:
  recipeId?: string
  recipeTitle?: string
  recipeImage?: string
  recipeUrl?: string
  customRecipeId?: string
  // text / event fields:
  text?: string
  url?: string
}

Menu = Record<"YYYY-MM-DD", DayEntry[]>

SavedMenu {
  id: string
  name: string
  entries: DayEntry[]
  createdAt: string             // ISO timestamp
}
```

### Grocery Types

```typescript
AggregatedIngredient {
  name: string
  totalAmount: number
  unit: string
  aisle: string
  originalLines: string[]
  checked: boolean
  recipes: string[]
}

ManualGroceryItem {
  id: string
  name: string
  amount?: string
  unit?: string
  aisle: string
  checked: boolean
}

GroceryListByAisle = Record<string, AggregatedIngredient[]>
```

### Persisted User Data Shape (KV / JSON)

```typescript
{
  menu: Menu
  favorites: string[]           // recipe IDs
  dislikedRecipes: string[]     // recipe IDs
  customRecipes: CustomRecipe[]
  manualGroceryItems: ManualGroceryItem[]
  groceryChecked: Record<string, boolean>
  familyMembers: string[]
  savedMenus: SavedMenu[]
}
```

---

## 3. State Management

### AppState (React Context + useReducer)

```
AppState
├── menu                  Menu (10-day rolling window)
├── favorites             string[]
├── dislikedRecipes       string[]
├── customRecipes         CustomRecipe[]
├── manualGroceryItems    ManualGroceryItem[]
├── groceryChecked        Record<string, boolean>
├── familyMembers         string[]
├── savedMenus            SavedMenu[]
├── recipeCache           Record<string, RecipeDetail>   ← in-memory only, not persisted
└── hydrated              boolean
```

### Dispatch Actions

| Category | Actions |
|----------|---------|
| Menu | `ADD_DAY_ENTRY`, `REMOVE_DAY_ENTRY`, `REORDER_DAY_ENTRIES`, `UPDATE_DAY_ENTRY` |
| Favorites | `TOGGLE_FAVORITE`, `TOGGLE_DISLIKED` |
| Custom Recipes | `ADD_CUSTOM_RECIPE`, `UPDATE_CUSTOM_RECIPE`, `REMOVE_CUSTOM_RECIPE`, `CACHE_RECIPE` |
| Groceries | `ADD_MANUAL_GROCERY`, `REMOVE_MANUAL_GROCERY`, `TOGGLE_MANUAL_GROCERY_CHECKED`, `TOGGLE_GROCERY_CHECKED` |
| Family | `ADD_FAMILY_MEMBER`, `REMOVE_FAMILY_MEMBER` |
| Saved Menus | `SAVE_DAY_AS_MENU`, `DELETE_SAVED_MENU`, `RENAME_SAVED_MENU`, `ADD_ENTRY_TO_SAVED_MENU` |
| Lifecycle | `HYDRATE` |

### Context Helper Methods

`addDayEntry()`, `removeDayEntry()`, `toggleFavorite()`, `isFavorite()`, `toggleDisliked()`, `isDisliked()`, `addFamilyMember()`, `removeFamilyMember()`, `forceSave()`

---

## 4. Routing & Navigation

### Pages

| Route | Auth | Description |
|-------|------|-------------|
| `/` | No | Redirects to `/menu` |
| `/login` | No | Google OAuth sign-in |
| `/menu` | Yes | 10-day meal plan |
| `/recipes` | Yes | Discovery, Favorites, My Recipes, My Menus tabs |
| `/groceries` | Yes | Aggregated shopping list from 10-day menu |
| `/view/[token]` | No | Read-only family view via share token |

### Navigation Components

- **Desktop**: `TopNav` — logo, 3 tabs, user avatar, sign out
- **Mobile**: `MobileHeader` (top) + `BottomNav` (3-tab, bottom)
- **Route protection**: `src/middleware.ts` intercepts `/menu/*`, `/recipes/*`, `/groceries/*` and redirects unauthenticated users to `/login`

---

## 5. Authentication

### Provider: NextAuth.js v5 + Google OAuth

```
User visits protected route
  → middleware.ts checks session
  → no session → redirect /login
  → /login → Google OAuth flow
  → callback → JWT created
     └── token.userId = Google providerAccountId (stable)
  → session cookie (30-day max age, HTTP-only, SameSite=lax)
  → session.user.id available in all API routes via auth()
```

### Key Files

| File | Role |
|------|------|
| `src/auth.ts` | NextAuth config (provider, callbacks, session) |
| `src/middleware.ts` | Route protection |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth handlers |

---

## 6. API Layer

### Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth login/logout handlers |
| `/api/data` | GET | Yes | Load user's persisted state |
| `/api/data` | POST | Yes | Save user's state |
| `/api/recipes/search` | GET | No | Search Edamam (query, cuisine, diet, type, pagination) |
| `/api/recipes/generate` | GET | No | 10 random recipes (excludes disliked) |
| `/api/recipes/[id]` | GET | No | Full recipe detail (1h ISR cache) |
| `/api/recipes/[id]/image` | GET | No | Proxied recipe image (24h cache) |
| `/api/share-token` | GET | Yes | Get or create user's share token |
| `/api/share-token` | DELETE | Yes | Regenerate share token |
| `/api/shared/[token]` | GET | No | Public menu data for family view |
| `/api/feedback` | POST | No | Create GitHub issue from in-app feedback |

### Notable Behaviors

- **`/api/recipes/[id]/image`** — proxies Edamam S3 images to work around CORS and signed URL expiry. Used as `onError` fallback in `DayEntryItem` and as primary source in `MenuShareCard`.
- **`/api/recipes/generate`** — fetches 20 internally, filters disliked recipes, returns 10.
- **`/api/shared/[token]`** — public, no auth. Returns `{ menu, customRecipes, familyMembers }`.

---

## 7. Data Persistence

### Write Path

```
User action
  → dispatch() → reducer → React state updated
  → useEffect in AppProvider (500ms debounce)
  → POST /api/data
  → KV.set("app-data:{userId}", state)     ← if KV configured
     OR write ./data/app-data-{userId}.json ← fallback
```

### Read Path (Hydration)

```
App mounts
  → GET /api/data
  → KV.get("app-data:{userId}") or read JSON file
  → dispatch("HYDRATE", data)
  → state.hydrated = true
```

### Share Token Storage

```
KV keys:
  "share-token:{token}"  → userId
  "share-user:{userId}"  → token

Fallback:
  ./data/share-tokens.json
```

### Storage Decision

```
KV_REST_API_URL set?
  Yes → Vercel KV (cross-device, production)
  No  → ./data/*.json (local dev only)
```

### Local Storage

- `/view/[token]` — stores selected family member name (`localStorage.setItem("family-name")`)

### Recipe Cache

- `recipeCache` in AppState is **in-memory only** (not persisted). Populated during grocery aggregation to avoid re-fetching full recipe details.

---

## 8. External Services

### Edamam Recipe API

- **Base**: `https://api.edamam.com/api/recipes/v2`
- **Custom header**: `Edamam-Account-User: mwfd-user`
- **Wrapper**: `src/lib/edamam-fetch.ts`
- **Transform**: `src/lib/edamam-transform.ts` — maps Edamam response to internal types, assigns aisles from food categories
- **Env**: `EDAMAM_APP_ID`, `EDAMAM_APP_KEY`

### Vercel KV (Redis)

- **Keys**: `app-data:{userId}`, `share-token:{token}`, `share-user:{userId}`
- **Env**: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- **Fallback**: Local JSON files in `./data/`

### Google OAuth

- **Via**: NextAuth.js
- **Env**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`

### Vercel Analytics

- **Package**: `@vercel/analytics/next`
- **Setup**: Zero-config on Vercel, silent no-op elsewhere

### GitHub API (optional)

- **Usage**: In-app feedback creates issues in the repo
- **Env**: `GITHUB_FEEDBACK_TOKEN`

---

## 9. Component Tree

```
layout.tsx
├── SessionWrapper (NextAuth provider)
│   └── AppProvider (Context + useReducer)
│       ├── TopNav (desktop)
│       │   └── logo, Menu / Recipes / Groceries tabs, user avatar
│       ├── MobileHeader (mobile)
│       │
│       ├── /menu → MenuPage
│       │   └── DayCard × 10
│       │       ├── DayEntryItem × n  (recipe/text/event rows, drag-to-reorder)
│       │       ├── AddEntrySheet     (add recipe, note, or event)
│       │       ├── EditNoteSheet     (edit text/event entry)
│       │       ├── SaveMenuSheet     (save day as reusable template)
│       │       ├── MenuShareCard     (off-screen, used for image generation)
│       │       └── DayPickerSheet    (move entry to another day)
│       │
│       ├── /recipes → RecipesPage
│       │   ├── Discover tab
│       │   │   └── SearchBar + filters + RecipeCard[]
│       │   ├── Favorites tab
│       │   │   └── RecipeCard[] grouped by category
│       │   ├── My Recipes tab
│       │   │   └── CustomRecipeSheet + custom recipe list
│       │   └── My Menus tab
│       │       └── SavedMenu[] (expand / rename / delete)
│       │
│       ├── /groceries → GroceriesPage
│       │   ├── GrocerySection × n    (grouped by store aisle)
│       │   └── ManualAddSheet        (add custom grocery item)
│       │
│       ├── /view/[token] → FamilyViewPage (no auth, read-only)
│       │   └── ReadOnlyDayCard × n
│       │
│       └── BottomNav (mobile)
│           └── Menu / Recipes / Groceries tabs
│
└── Analytics
```

---

## 10. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_SECRET` | Yes | NextAuth signing secret |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth client secret |
| `EDAMAM_APP_ID` | Yes | Edamam API app ID |
| `EDAMAM_APP_KEY` | Yes | Edamam API app key |
| `KV_REST_API_URL` | No | Vercel KV endpoint (falls back to filesystem) |
| `KV_REST_API_TOKEN` | No | Vercel KV auth token |
| `GITHUB_FEEDBACK_TOKEN` | No | GitHub PAT for feedback issue creation |
| `NEXT_PUBLIC_VERSION` | No | App version shown in nav (from package.json) |
