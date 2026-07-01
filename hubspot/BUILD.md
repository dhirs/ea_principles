# Build & Run — CRM (leads + events)

The CRM is a Next.js app in **`hubspot/ui/`** (port **3001**), Supabase-backed.
Despite the folder name it uses **zero HubSpot API**. Full feature docs:
`hubspot/ui/crm.md`. This file is just how to build, run, and deploy it.

## Prerequisites

- **Node 22** (nvm default). `cd hubspot/ui && npm install` (first time only).
- A **repo-root `.env`** (`../../.env` from `hubspot/ui`) — gitignored, holds all
  secrets. Required keys:

  ```env
  SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_KEY=<service-role secret key>     # server-side only, bypasses RLS
  CRM_SESSION_SECRET=<32-byte random hex>    # signs the login session cookie
  ```

  Generate the session secret with `openssl rand -hex 32`. `next.config.ts` loads
  this file into `process.env` at startup (so the Edge middleware sees
  `CRM_SESSION_SECRET`); real environment vars override the file.

## Login gate

Every route is gated by `middleware.ts`; unauthenticated page loads redirect to
`/login`, API calls get 401. Single hardcoded user (see `lib/auth.ts`):

- **Email:** `dsaxena@gmail.com`
- **Password:** set in `lib/auth.ts` (`AUTH_PASSWORD`)

The password is checked server-side only; the browser gets a 7-day HMAC-signed
`crm_session` cookie (signed with `CRM_SESSION_SECRET`), never the password.
Change the credential in `lib/auth.ts`; rotating `CRM_SESSION_SECRET` invalidates
all existing sessions.

## Run (dev)

```bash
cd hubspot/ui
npm run dev            # http://localhost:3001  (next dev -p 3001)
```

Or from the repo root: `./scripts/start_supabase_ui.sh`.

## Build & start (production)

```bash
cd hubspot/ui
npm run build          # next build  -> .next/
npm run start          # next start -p 3001
```

`npm run build` reads the repo-root `.env` via `next.config.ts`, so the same
`SUPABASE_*` + `CRM_SESSION_SECRET` must be present at build/runtime. On a host
(Vercel etc.) that has no repo-root `.env`, set those three as real environment
variables instead — `next.config.ts` skips the missing file and uses them.

## Importing attendance data

`hubspot/load_maven_attendance.py` loads the Maven signups/attendance CSV (from
`uploads/`) into `maven_events` + `leads` + `maven_attendance`, all via the
PostgREST URL. Idempotent; safe to re-run:

```bash
python3 hubspot/load_maven_attendance.py
```

## Troubleshooting

- **500 on every page after an env change** — restart the dev server;
  `next.config.ts` and `process.env` are read at startup, not hot-reloaded.
- **`CRM_SESSION_SECRET is not set`** — the key is missing from repo-root `.env`
  (or the app's environment). Add it and restart.
- **Empty data / RLS errors** — `SUPABASE_KEY` must be the **service-role** key.
- **Port already in use** — `lsof -ti :3001 | xargs kill -9`.
