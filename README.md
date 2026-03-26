# Mom, What's for Dinner?

A mobile-first meal planning web app for families. Plan the week's meals, build a grocery list automatically, and share a read-only view with family members.

## Features

- **Menu planning** — plan meals for the next 10 days
- **Recipe discovery** — search recipes or generate random suggestions
- **Favorites** — save recipes you love for quick access
- **My Recipes** — add your own custom recipes with ingredients
- **Grocery list** — auto-generated from the week's planned meals
- **Family sharing** — share a read-only link with family members
- **PWA** — installable on iPhone/Android home screen

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Auth | NextAuth v5 (Auth.js) + Google OAuth |
| Database | Vercel KV (Redis via Upstash) |
| Deployment | Vercel |
| Recipe API | Edamam |

## Project Structure

```
src/
├── app/                  # Next.js app router pages & API routes
│   ├── api/              # API routes (recipes, data, share)
│   ├── groceries/        # Grocery list page
│   ├── menu/             # Menu planning page
│   ├── recipes/          # Recipe discovery page
│   └── view/[token]/     # Read-only family share page
├── components/
│   ├── layout/           # Header, nav, bottom sheet
│   ├── menu/             # Day cards, entry items
│   ├── recipes/          # Recipe cards, search
│   ├── groceries/        # Grocery sections
│   └── shared/           # Reusable components
├── lib/                  # Utilities (dates, emoji mapping)
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
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API token |
| `EDAMAM_APP_ID` | Edamam recipe API app ID |
| `EDAMAM_APP_KEY` | Edamam recipe API app key |
| `NEXT_PUBLIC_VERSION` | App version shown in header |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Storage

User data (menu, favorites, custom recipes) is stored in Vercel KV keyed by the user's stable Google account ID. In local development without KV configured, data falls back to local JSON files in `data/`.
