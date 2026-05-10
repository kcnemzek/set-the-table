# SetTheTable

A mobile-first meal planning web app for families. Plan the week's meals, build a grocery list automatically, and share a read-only view with family members.

## Features

- **Menu planning** — plan meals for the next 10 days
- **Discover** — search recipes or generate random AI-powered suggestions; its own dedicated tab separate from your saved library
- **Favorites** — save recipes you love for quick access
- **My Recipes** — add your own custom recipes with ingredients; import by pasting text or uploading up to 2 photos (snap or from library) for multi-page recipes (AI-powered)
- **Cheat Sheets** — save the things you always look up: how long to poach chicken, ingredient swaps, timing tricks
- **Grocery list** — auto-generated from the week's planned meals, with store assignment and store filter chips; **Staples tab** lets you manage items you always keep stocked and pull them into the active list with one tap (per-item or all at once)
- **Event planning** — plan holiday dinners and special occasions with a dish list, prep timeline, and automatic grocery list integration; tasks are scheduled relative to the event date (e.g. "3 days before") and auto-shift when the event date changes; events and their tasks auto-surface on the relevant days in the menu view
- **Templates** — save and reuse sets of day entries as named templates (e.g. Taco Tuesday); pick from the Add to Day sheet with per-entry deselect before stamping
- **Household & roles** — create a household to share the menu and grocery list with family; three roles: Executive Chef (full access), Sous Chef (edit), and At the Table (view-only); Executive Chef invites by email and members join automatically when they sign in with Google
- **Family sharing** — each family member gets their own invite link; they can view the menu and add grocery requests attributed to them
- **PWA** — installable on iPhone/Android home screen

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Auth | NextAuth v5 (Auth.js) + Google OAuth |
| Database | Upstash Redis (via `@vercel/kv`) |
| Deployment | Vercel |
| Recipe API | Edamam |
| AI | Anthropic Claude (Haiku) |
| Observability | LangSmith |

## Project Structure

```
src/
├── app/                  # Next.js app router pages & API routes
│   ├── api/              # API routes (recipes, data, household, share)
│   ├── discover/         # Recipe discovery page (search + AI generate)
│   ├── event-planning/   # Event planning list page + [id] detail page
│   ├── groceries/        # Grocery list page
│   ├── menu/             # Menu planning page
│   ├── recipes/          # My Kitchen page (Favorites, My Recipes, Tips)
│   ├── settings/         # Household management (roles, invites)
│   └── view/[token]/     # Read-only family share page
├── components/
│   ├── layout/           # Header, nav, bottom sheet
│   ├── menu/             # Day cards, entry items
│   ├── recipes/          # Recipe cards, search
│   ├── groceries/        # Grocery sections
│   └── shared/           # Reusable components
├── lib/                  # Utilities (dates, emoji mapping, invite/household helpers)
├── store/                # React context + state management
├── types/                # TypeScript types
├── auth.ts               # NextAuth configuration (+ household invite resolution)
└── middleware.ts          # Route protection
```

## Environment Variables

| Variable | Description |
|---|---|
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `AUTH_SECRET` | NextAuth secret key |
| `KV_REST_API_URL` | Upstash Redis REST API URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST API token |
| `EDAMAM_APP_ID` | Edamam recipe API app ID |
| `EDAMAM_APP_KEY` | Edamam recipe API app key |
| `NEXT_PUBLIC_VERSION` | App version shown in header |
| `ANTHROPIC_API_KEY` | Claude API key (recipe import) |
| `LANGSMITH_API_KEY` | LangSmith tracing key |
| `LANGSMITH_TRACING_V2` | Set to `true` to enable tracing |
| `LANGSMITH_PROJECT` | Set to `whats-for-dinner` |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Storage

User data is stored in **Upstash Redis** via `@vercel/kv`. Solo users have a single key; household members share one key routed by `resolveDataKey(userId)`:

| KV key | Contents |
|--------|---------|
| `app-data:{userId}` | Solo user's full app state |
| `household-data:{householdId}` | Shared app state for household members |
| `household:{householdId}` | Household record (members, pending invites) |
| `user-household:{userId}` | Maps a user ID to their household ID |
| `pending-invite:{email}` | Email invite awaiting first Google sign-in |

In local development without `KV_REST_API_URL` configured, all keys fall back to local JSON files in `data/`.
