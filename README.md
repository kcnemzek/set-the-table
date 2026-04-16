# Mom, What's for Dinner?

A mobile-first meal planning web app for families. Plan the week's meals, build a grocery list automatically, and share a read-only view with family members.

## Features

- **Menu planning** — plan meals for the next 10 days
- **Discover** — search recipes or generate random AI-powered suggestions; its own dedicated tab separate from your saved library
- **Favorites** — save recipes you love for quick access
- **My Recipes** — add your own custom recipes with ingredients; import by pasting text or uploading up to 2 photos (snap or from library) for multi-page recipes (AI-powered)
- **Cheat Sheets** — save the things you always look up: how long to poach chicken, ingredient swaps, timing tricks
- **Grocery list** — auto-generated from the week's planned meals, with store assignment, store filter chips, and tabbed views for Recipes, Family requests, and All
- **Event planning** — plan holiday dinners and special occasions with a dish list, prep timeline, and automatic grocery list integration; tasks are scheduled relative to the event date (e.g. "3 days before") and auto-shift when the event date changes; events and their tasks auto-surface on the relevant days in the menu view
- **Templates** — save and reuse sets of day entries as named templates (e.g. Taco Tuesday); pick from the Add to Day sheet with per-entry deselect before stamping
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
│   ├── api/              # API routes (recipes, data, share)
│   ├── discover/         # Recipe discovery page (search + AI generate)
│   ├── event-planning/   # Event planning list page + [id] detail page
│   ├── groceries/        # Grocery list page
│   ├── menu/             # Menu planning page
│   ├── recipes/          # My Kitchen page (Favorites, My Recipes, Tips)
│   └── view/[token]/     # Read-only family share page
├── components/
│   ├── layout/           # Header, nav, bottom sheet
│   ├── menu/             # Day cards, entry items
│   ├── recipes/          # Recipe cards, search
│   ├── groceries/        # Grocery sections
│   └── shared/           # Reusable components
├── lib/                  # Utilities (dates, emoji mapping, invite token helpers)
├── store/                # React context + state management
├── types/                # TypeScript types
├── auth.ts               # NextAuth configuration
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

User data (menu, favorites, custom recipes) is stored in **Upstash Redis**, keyed by the user's stable Google account ID (`app-data:<userId>`). The app uses the `@vercel/kv` package, which connects to Upstash under the hood via the `KV_REST_API_URL` and `KV_REST_API_TOKEN` env vars. In local development without those vars configured, data falls back to local JSON files in `data/`.
