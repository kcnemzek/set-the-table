# set-the-table

Main app for **SetTheTable** — recipes, meal planning, event planning, and grocery management.

## Stack

- **Next.js 15** (App Router) with TypeScript
- **Tailwind CSS v3**
- **next-auth v5** — authentication
- **Vercel KV** — data store
- **@dnd-kit** — drag-and-drop reordering
- **Anthropic SDK** — AI features
- Deployed on **Vercel**

## Routes

| Route | Purpose |
|---|---|
| `/` | Home / daily menu |
| `/menu` | Weekly menu planning |
| `/recipes` | Recipe library |
| `/discover` | Discover new recipes |
| `/groceries` | Grocery list |
| `/event-planning` | Event and dinner party planning |
| `/settings` | Household management (roles, invites) |
| `/login` | Auth login |

## Household & Roles

Data is stored in Vercel KV. Solo users use `app-data:${userId}`. Users in a household share `household-data:${householdId}`.

**KV key patterns:**
- `app-data:${userId}` — solo user data
- `household-data:${householdId}` — shared household data
- `household:${householdId}` — Household record (members, pending invites)
- `user-household:${userId}` — maps user to their householdId
- `pending-invite:${email}` — invite awaiting account creation

**Roles** (`src/types/index.ts`): `executive-chef` | `sous-chef` | `commensal`

**Invite flow:** Executive Chef enters an email in Settings → `pending-invite:${email}` is stored → when that person signs in with Google OAuth, the `signIn` callback in `src/auth.ts` resolves the invite and adds them to the household automatically.

**`menuDayMeta`**: `Record<"YYYY-MM-DD", { isSet: boolean }>` — per-day "Dinner is set" signal, toggled from the DayCard header (utensils icon). Stored in shared household data.

## Testing

### Unit tests (Vitest)

```bash
npm test               # run all unit tests once
npm run test:watch     # watch mode
npm run test:unit      # run core unit tests only (reducer, dates, emoji, ingredients)
```

Unit tests live in `src/test/`.

### E2E tests (Playwright)

**Important:** start the dev server first, then run tests in a second terminal. Playwright will reuse the running server rather than trying to start its own.

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run test:e2e        # headless
npm run test:e2e:ui     # opens the Playwright UI (recommended for development)
```

E2E tests live in `e2e/`. Auth is handled via a generated session cookie in `e2e/global-setup.ts` — requires `AUTH_SECRET` in `.env.local`.
