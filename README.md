# Luv AI

An AI-companion social app with Solana wallet payments. Users discover and match
with companions, chat in real time, and unlock premium companions via on-chain
payments.

## Tech stack

- **Frontend:** Vite, React 18, TypeScript, Tailwind CSS, shadcn-ui
- **Backend:** Supabase (Postgres, Auth, Realtime, Edge Functions)
- **Payments / Web3:** Solana wallet adapters (Phantom, Solflare, Backpack)
- **Data:** TanStack Query

## Local development

Requires Node.js 18+.

```sh
# Install dependencies
npm install

# Start the dev server (http://localhost:8080)
npm run dev
```

Other scripts:

```sh
npm run build      # production build to ./dist
npm run preview    # preview the production build locally
npm run lint       # run ESLint
```

## Environment variables

Client config is read from `.env` (all `VITE_`-prefixed and public by design):

| Variable                        | Purpose                          |
| ------------------------------- | -------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL             |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key    |
| `VITE_SUPABASE_PROJECT_ID`      | Supabase project ref             |
| `VITE_SOLANA_RPC_URL`           | Solana RPC endpoint (Helius)     |
| `VITE_VAPID_PUBLIC_KEY`         | Web-push VAPID public key        |

Server-side secrets (service-role key, payment keys, AI provider key, etc.) are
configured in the Supabase project, not in this repo.

## Deployment

- **Frontend** is hosted on Vercel and deploys automatically on push to `main`.
  Client-side routing relies on the SPA rewrite in `vercel.json`.
- **Backend** (database migrations under `supabase/migrations` and the edge
  functions under `supabase/functions`) is deployed to Supabase separately —
  Vercel does not deploy these. Use the Supabase CLI or dashboard.
