# SetTheTable — Architecture

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
| AI | Anthropic Claude Haiku 4.5 |
| Observability | LangSmith (via `langsmith/wrappers`) |
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

### Family Types

```typescript
FamilyMember {
  id: string              // uuid
  name: string
  inviteToken: string     // uuid — used as the token in /view/[token]
}

FamilyGroceryItem {
  id: string
  name: string
  addedBy: string         // member name
  addedAt: string         // ISO timestamp
}
```

### Household & Role Types

```typescript
HouseholdRole = "executive-chef" | "sous-chef" | "commensal"

HouseholdMember {
  userId: string          // Google providerAccountId
  email: string
  name: string
  role: HouseholdRole
  joinedAt: string        // ISO timestamp
}

PendingInvite {
  email: string
  role: HouseholdRole
  householdId: string
  invitedAt: string       // ISO timestamp
  invitedBy: string       // inviter's name
}

Household {
  id: string
  name: string
  members: HouseholdMember[]
  pendingInvites: PendingInvite[]
  createdAt: string
  createdBy: string       // userId
}

```

### Tip Types

```typescript
Tip {
  id: string
  title: string
  body: string
  category?: string             // Technique | Timing | Substitution | Storage | General
  createdAt: string             // ISO timestamp
}
```

### Event Planning Types

```typescript
EventDish {
  id: string
  title: string
  recipeId?: string             // links to Edamam/API recipe for grocery integration
  customRecipeId?: string       // links to CustomRecipe for grocery integration
}

EventTask {
  id: string
  text: string
  daysBeforeEvent?: number      // days relative to event (positive = before, 0 = day of, negative = after)
  date?: string                 // "YYYY-MM-DD" — computed cache; always derived from daysBeforeEvent when set
  time?: string                 // "HH:MM" 24h
  completed: boolean
  customRecipeId?: string       // optional recipe link
  recipeTitle?: string
}

EventPlan {
  id: string
  name: string
  date: string                  // ISO date of the event
  dishes: EventDish[]
  tasks: EventTask[]
  addedToGroceries: boolean     // when true, linked recipe ingredients feed into grocery list
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
  manualId?: string             // set when item originates from a ManualGroceryItem
  store?: string                // assigned store name
}

ManualGroceryItem {
  id: string
  name: string
  amount?: string
  unit?: string
  aisle: string
  checked: boolean
  store?: string
  stapleId?: string             // set when item was added from the Staples list
}

StapleItem {
  id: string
  name: string
  aisle: string
  store?: string
}

FamilyGroceryItem {
  id: string
  name: string
  addedBy: string
  addedAt: string
  checked: boolean
  store?: string
}

GroceryListByAisle = Record<string, AggregatedIngredient[]>
```

### Persisted User Data Shape (KV / JSON)

Stored at `app-data:{userId}` (solo) or `household-data:{householdId}` (shared):

```typescript
{
  menu: Menu
  favorites: string[]           // recipe IDs
  dislikedRecipes: string[]     // recipe IDs
  customRecipes: CustomRecipe[]
  manualGroceryItems: ManualGroceryItem[]
  groceryChecked: Record<string, boolean>
  groceryItemStores: Record<string, string>  // key: "aisle|name|unit" → store name
  familyMembers: FamilyMember[]
  savedMenus: SavedMenu[]
  tips: Tip[]
  eventPlans: EventPlan[]
  stores: string[]              // ordered list of store names for grocery assignment
  staples: StapleItem[]         // always-stocked items; can be pulled into the active grocery list
}
```

Family grocery items are stored separately, keyed by owner userId (not inside the main user data blob):

```typescript
// KV key: "family-groceries:{userId}" → FamilyGroceryItem[]
// Local fallback: ./data/family-groceries-{userId}.json
```

Household records are stored at separate KV keys (not part of user data):

```typescript
// KV key: "household:{householdId}"          → Household
// KV key: "user-household:{userId}"          → householdId string
// KV key: "pending-invite:{email}"           → PendingInvite
```

---

## 3. State Management

### AppState (React Context + useReducer)

```
AppState
├── menu                  Menu (all dates; UI shows a week-based window)
├── favorites             string[]
├── dislikedRecipes       string[]
├── customRecipes         CustomRecipe[]
├── manualGroceryItems    ManualGroceryItem[]
├── groceryChecked        Record<string, boolean>
├── groceryItemStores     Record<string, string>         ← key: "aisle|name|unit" → store
├── familyMembers         FamilyMember[]
├── savedMenus            SavedMenu[]
├── tips                  Tip[]
├── eventPlans            EventPlan[]
├── stores                string[]                       ← ordered store names
├── staples               StapleItem[]                   ← always-stocked items
├── recipeCache           Record<string, RecipeDetail>   ← in-memory only, not persisted
└── hydrated              boolean
```

### Dispatch Actions

| Category | Actions |
|----------|---------|
| Menu | `ADD_DAY_ENTRY`, `REMOVE_DAY_ENTRY`, `REORDER_DAY_ENTRIES`, `UPDATE_DAY_ENTRY` |
| Favorites | `TOGGLE_FAVORITE`, `TOGGLE_DISLIKED` |
| Custom Recipes | `ADD_CUSTOM_RECIPE`, `UPDATE_CUSTOM_RECIPE`, `REMOVE_CUSTOM_RECIPE`, `CACHE_RECIPE` |
| Groceries | `ADD_MANUAL_GROCERY`, `REMOVE_MANUAL_GROCERY`, `TOGGLE_MANUAL_GROCERY_CHECKED`, `TOGGLE_GROCERY_CHECKED`, `SET_ITEM_STORE`, `SET_MANUAL_GROCERY_STORE`, `RESET_STORE_ITEMS`, `SET_STORE_FOR_ALL_UNASSIGNED` |
| Family | `ADD_FAMILY_MEMBER`, `REMOVE_FAMILY_MEMBER` |
| Templates | `SAVE_DAY_AS_MENU`, `DELETE_SAVED_MENU`, `RENAME_SAVED_MENU`, `ADD_ENTRY_TO_SAVED_MENU` |
| Tips | `ADD_TIP`, `UPDATE_TIP`, `DELETE_TIP` |
| Event Plans | `ADD_EVENT_PLAN`, `UPDATE_EVENT_PLAN`, `DELETE_EVENT_PLAN`, `ADD_EVENT_DISH`, `REMOVE_EVENT_DISH`, `ADD_EVENT_TASK`, `UPDATE_EVENT_TASK`, `REMOVE_EVENT_TASK`, `TOGGLE_EVENT_GROCERIES` |
| Staples | `ADD_STAPLE`, `UPDATE_STAPLE`, `REMOVE_STAPLE`, `TOGGLE_STAPLE_IN_LIST`, `ADD_ALL_STAPLES_TO_LIST` |
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
| `/menu` | Yes | Weekly meal plan with Sun–Sat week navigation and 6-month history |
| `/discover` | Yes | Discover — recipe search + AI generate (Edamam) |
| `/recipes` | Yes | My Kitchen — Favorites, My Recipes, Cheat Sheets tabs |
| `/groceries` | Yes | Aggregated shopping list from 10-day menu + event plans; store filter chips |
| `/event-planning` | Yes | Event list (Events tab) + Templates tab |
| `/event-planning/[id]` | Yes | Event detail — dishes, prep timeline, grocery toggle |
| `/settings` | Yes | Household management — create, invite members, manage roles |
| `/view/[token]` | No | Read-only family view via share token |

### Navigation Components

- **Desktop**: `TopNav` — logo, 5 tabs (Menu, Discover, My Kitchen, Groceries, Events), user avatar, sign out
- **Mobile**: `MobileHeader` (top) + `BottomNav` (6-tab: Menu, Discover, My Kitchen, Groceries, Events, Settings)
- **Route protection**: `src/middleware.ts` intercepts `/menu/*`, `/discover/*`, `/recipes/*`, `/groceries/*`, `/event-planning/*`, `/settings/*` and redirects unauthenticated users to `/login`

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
  → signIn callback fires
     └── checks pending-invite:{email} in KV
         → if found: adds user to household, clears invite
  → session cookie (30-day max age, HTTP-only, SameSite=lax)
  → session.user.id available in all API routes via auth()
```

### Key Files

| File | Role |
|------|------|
| `src/auth.ts` | NextAuth config (provider, callbacks, session, invite resolution) |
| `src/middleware.ts` | Route protection |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth handlers |
| `src/lib/household.ts` | KV helpers for household, membership, and invite records |

---

## 6. API Layer

### Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth login/logout handlers |
| `/api/data` | GET | Yes | Load user's persisted state (resolved to household or solo key) |
| `/api/data` | POST | Yes | Save user's state (resolved to household or solo key) |
| `/api/household` | GET | Yes | Return current user's household or null |
| `/api/household` | POST | Yes | Create a new household; copies solo data to shared key |
| `/api/household` | DELETE | Yes | Leave the household; restores solo data if last member |
| `/api/household/members` | POST | Yes | Invite a member by email (executive-chef only) |
| `/api/household/members` | DELETE | Yes | Remove a member (`?userId=`) or revoke invite (`?email=`) |
| `/api/recipes/search` | GET | No | Search Edamam (query, cuisine, diet, type, pagination) |
| `/api/recipes/generate` | GET | No | 10 random recipes (excludes disliked) |
| `/api/recipes/web-search` | GET | No | Natural language recipe web search via Claude (`web_search_20250305` tool); returns `WebSearchResult[]` |
| `/api/recipes/fetch-url` | POST | No | Fetch a recipe URL server-side, extract readable text, parse into structured recipe via Claude Haiku |
| `/api/recipes/[id]` | GET | No | Full recipe detail (1h ISR cache) |
| `/api/recipes/[id]/image` | GET | No | Proxied recipe image (24h cache) |
| `/api/share-token` | GET | Yes | Get or create user's read-only share token |
| `/api/share-token` | DELETE | Yes | Regenerate read-only share token |
| `/api/family-members` | POST | Yes | Create a family member + generate invite token |
| `/api/family-members/[id]` | DELETE | Yes | Remove a family member + revoke invite token |
| `/api/shared/[token]` | GET | No | Public menu data — resolves invite tokens (per-member) or share tokens (read-only) |
| `/api/shared/[token]/grocery` | GET | No | Family member fetches current grocery request list |
| `/api/shared/[token]/grocery` | POST | No | Family member adds a grocery request (token = identity) |
| `/api/shared/[token]/grocery/[id]` | DELETE | No | Family member removes their own grocery request |
| `/api/groceries/family` | GET | Yes | Owner fetches all family grocery requests |
| `/api/groceries/family` | DELETE | Yes | Owner clears all family grocery requests |
| `/api/groceries/family/[id]` | DELETE | Yes | Owner removes a single family grocery request |
| `/api/feedback` | POST | No | Create GitHub issue from in-app feedback |
| `/api/recipes/parse` | POST | No | Parse recipe from pasted text or image via Claude Haiku; traced via LangSmith |

### Notable Behaviors (recipes)

- **`/api/recipes/web-search`** — `ClaudeWebSearchService` implements the `WebSearchService` interface (`src/lib/recipe-search.ts`). To swap the search provider (e.g. Brave Search), implement `WebSearchService` and update the route. Handles multi-turn tool_use if Claude requires it.
- **`/api/recipes/fetch-url`** — fetches the page with a 10s timeout, strips scripts/styles/nav/header/footer via `extractTextFromHtml` (`src/lib/extract-html-text.ts`), then passes up to 8 000 chars to Claude Haiku. Returns the same JSON shape as `/api/recipes/parse`. Returns HTTP 422 when the page cannot be fetched (blocked, timeout, non-2xx).

### Notable Behaviors

- **`/api/recipes/[id]/image`** — proxies Edamam S3 images to work around CORS and signed URL expiry. Used as `onError` fallback in `DayEntryItem` and as primary source in `MenuShareCard`.
- **`/api/recipes/generate`** — fetches 20 internally, filters disliked recipes, returns 10.
- **`/api/shared/[token]`** — public, no auth. Tries invite-token lookup first (`type: "invite"`, returns `memberName`); falls back to share-token lookup (`type: "shared"`, returns `familyMembers` name list).
- **`/api/shared/[token]/grocery`** — the invite token acts as the family member's credential. Server resolves `invite-token:{token}` → `{ userId, memberName }` before accepting writes.
- **`/api/data` GET** — auto-migrates `familyMembers: string[]` to `FamilyMember[]` on first load, generating invite tokens for any legacy string members.

---

## 7. Data Persistence

### Write Path

```
User action
  → dispatch() → reducer → React state updated
  → useEffect in AppProvider (500ms debounce)
  → POST /api/data
  → resolveDataKey(userId)
      → "household-data:{householdId}"  ← if in a household
         OR "app-data:{userId}"          ← solo
  → pruneMenuHistory(state.menu)        ← drops dates older than 180 days
  → KV.set(dataKey, state)              ← if KV configured
     OR write ./data/{key-as-filename}.json ← fallback
```

### Read Path (Hydration)

```
App mounts
  → GET /api/data
  → resolveDataKey(userId)
  → KV.get(dataKey) or read JSON file
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

### Invite Token Storage (per-member)

```
KV keys:
  "invite-token:{token}"  → { userId, memberName }

Fallback:
  ./data/invite-tokens.json

Helpers: src/lib/invite-tokens.ts
  storeInviteToken(), deleteInviteToken(), resolveInviteToken()
```

### Family Grocery Storage

```
KV keys:
  "family-groceries:{userId}"  → FamilyGroceryItem[]

Fallback:
  ./data/family-groceries-{userId}.json

Helpers: src/lib/invite-tokens.ts
  readFamilyGroceries(), writeFamilyGroceries()
```

### Household Storage

```
KV keys:
  "household:{householdId}"       → Household record (members, pending invites)
  "user-household:{userId}"       → householdId string
  "pending-invite:{email}"        → PendingInvite (resolved on next sign-in)
  "household-data:{householdId}"  → shared app state (same shape as app-data)

Fallback:
  ./data/{key-with-colons-replaced-by-dashes}.json

Helpers: src/lib/household.ts
  getHousehold(), saveHousehold()
  getUserHouseholdId(), setUserHouseholdId(), deleteUserHouseholdId()
  storePendingInvite(), getPendingInvite(), deletePendingInvite()
  resolveDataKey(userId) → "household-data:{id}" or "app-data:{userId}"
```

### Storage Decision

```
KV_REST_API_URL set?
  Yes → Vercel KV (cross-device, production)
  No  → ./data/*.json (local dev only)
```

### Local Storage

- `/view/[token]` (shared/legacy links only) — stores selected family member name (`localStorage.setItem("family-name")`). Not used for invite-token links (identity comes from the token itself).

### Recipe Cache

- `recipeCache` in AppState is **in-memory only** (not persisted). Populated during grocery aggregation to avoid re-fetching full recipe details.

---

## 8. External Services

### Edamam Recipe API

- **Base**: `https://api.edamam.com/api/recipes/v2`
- **Custom header**: `Edamam-Account-User: mwfd-user`
- **Wrapper**: `src/lib/edamam-fetch.ts`
- **Transform**: `src/lib/edamam-transform.ts` — maps Edamam response to internal types, assigns aisles from food categories
- **Ingredient parser**: `src/lib/parse-ingredient.ts` — parses free-text ingredient strings (e.g. "2 cups flour") into structured `{ amount, unit, name }` fields for custom recipes
- **Env**: `EDAMAM_APP_ID`, `EDAMAM_APP_KEY`

### Vercel KV (Redis)

- **Keys**: `app-data:{userId}`, `household-data:{householdId}`, `household:{householdId}`, `user-household:{userId}`, `pending-invite:{email}`, `share-token:{token}`, `share-user:{userId}`, `invite-token:{token}`, `family-groceries:{userId}`
- **Env**: `KV_REST_API_URL`, `KV_REST_API_TOKEN`
- **Fallback**: Local JSON files in `./data/`

### Google OAuth

- **Via**: NextAuth.js
- **Env**: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET`

### Vercel Analytics

- **Package**: `@vercel/analytics/next`
- **Setup**: Zero-config on Vercel, silent no-op elsewhere

### Anthropic Claude

- **Model**: `claude-haiku-4-5-20251001`
- **Usage**:
  - Recipe import — parses pasted text or photos into structured `CustomRecipe` JSON (`POST /api/recipes/parse`)
  - Web recipe search — natural language queries using the `web_search_20250305` tool (`GET /api/recipes/web-search`)
  - URL import — fetches a recipe page server-side and parses it (`POST /api/recipes/fetch-url`)
- **Search abstraction**: `WebSearchService` interface in `src/lib/recipe-search.ts`; `ClaudeWebSearchService` is the current implementation inside the web-search route. Swap by implementing the interface and updating the route.
- **HTML extraction**: `extractTextFromHtml` in `src/lib/extract-html-text.ts` strips non-content elements before passing page text to Claude.
- **Env**: `ANTHROPIC_API_KEY`
- **Tracing**: Parse and fetch-url calls wrapped with `traceable` from `langsmith/traceable`; traces appear in the `whats-for-dinner` LangSmith project

### LangSmith

- **Usage**: Observability for Claude API calls in `/api/recipes/parse`
- **Env**: `LANGSMITH_API_KEY`, `LANGSMITH_TRACING_V2=true`, `LANGSMITH_PROJECT=whats-for-dinner`

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
│       ├── /menu → MenuPage (client — holds weekOffset state)
│       │   ├── week nav header: ChevronLeft / range label / ChevronRight / Today button
│       │   └── DayCard × 7–10 (week view; 8–10 days on Thu–Sat to bridge to next week)
│       │       ├── DayEventSummaries (auto-surfaced event headlines + tasks; read-only, always top)
│       │       ├── DayEntryItem × n  (recipe/text/headline rows, drag-to-reorder)
│       │       ├── AddEntrySheet     (3 tabs: My Recipes, Favorites, Templates; + Note/Headline pills)
│       │       │   └── TemplatePreviewSheet (per-entry deselect before stamping to day)
│       │       ├── EditNoteSheet     (edit note/headline entry)
│       │       ├── SaveMenuSheet     (save day as reusable template)
│       │       ├── MenuShareCard     (off-screen, used for image generation)
│       │       └── DayPickerSheet    (move entry to another day)
│       │
│       ├── /discover → DiscoverPage  (nav label: "Discover")
│       │   ├── Browse mode: SearchBar + cuisine/dish/diet filters + RecipeCard[] + AI Generate button (Edamam)
│       │   ├── Web Search mode: SearchBar → WebSearchResultCard[] (View ↗ + Import per result)
│       │   │   Import flow: fetch-url → CustomRecipeSheet (prefill prop) → saved as CustomRecipe
│       │   └── Mode toggle persists within session (Browse / Web Search)
│       │
│       ├── /recipes → RecipesPage  (nav label: "My Kitchen")
│       │   ├── Favorites tab
│       │   │   └── RecipeCard[] grouped by category; shared library search bar
│       │   ├── My Recipes tab
│       │   │   └── CustomRecipeSheet (view mode by default → Edit button switches to edit mode)
│       │   │       custom recipe list; ingredients entered as free text, parsed on save
│       │   │       import options: From URL (fetch-url route), paste text, or queue 1–2 photos (snap/upload)
│       │   │       prefill prop: accepts pre-parsed data when opened from Discover web search import flow
│       │   │       source URL always saved on CustomRecipe.url
│       │   └── Cheat Sheets tab
│       │       └── TipSheet + cheat sheet list (sorted by title)
│       │
│       ├── /groceries → GroceriesPage
│       │   ├── Tab: List / Staples
│       │   ├── List tab:
│       │   │   ├── Store filter chips (All, Unassigned, per-store)
│       │   │   ├── GrocerySection × n    (recipe + event ingredients, grouped by aisle)
│       │   │   ├── Family requests section (grouped by member name, owner can remove)
│       │   │   └── ManualAddSheet        (add custom grocery item)
│       │   └── Staples tab:
│       │       └── StaplesTab (staples grouped by aisle; tap row to edit; ShoppingCart toggles into list)
│       │
│       ├── /event-planning → EventPlanningPage
│       │   ├── Events tab
│       │   │   └── EventPlan[] sorted by date (upcoming / past) → navigates to detail
│       │   └── Templates tab
│       │       └── SavedMenu[] (expand / rename / delete / add-to-day)
│       │
│       ├── /event-planning/[id] → EventDetailPage
│       │   ├── Editable name + date header (changing date auto-shifts all relative task dates)
│       │   ├── Grocery toggle (TOGGLE_EVENT_GROCERIES)
│       │   ├── Dishes section  (AddDishSheet — freeform + optional custom recipe link)
│       │   └── Timeline section (TaskSheet — text, days relative to event, time; grouped by date)
│       │
│       ├── /settings → SettingsPage
│       │   ├── Household section: create / member list / pending invites / invite form / leave
│       │   └── Roles guide section (Executive Chef, Sous Chef, At the Table descriptions)
│       │       Note: household UI is also embedded in AppMenuSheet (hamburger → Settings tab)
│       │
│       ├── /view/[token] → FamilyViewPage (no auth)
│       │   ├── Invite-token path: shows member name, ReadOnlyDayCard × n, grocery request input
│       │   └── Shared-token path: name picker → ReadOnlyDayCard × n (read-only)
│       │
│       └── BottomNav (mobile)
│           └── Menu / Discover / My Kitchen / Groceries / Events / Settings tabs
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
