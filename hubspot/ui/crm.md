# CRM — Leads UI

A standalone Next.js app for browsing the `leads` table in Supabase. Lives in
`hubspot/ui/`, separate from the principles app (which runs on port 3000). This
one runs on **port 3001**.

## Run

```bash
cd hubspot/ui
npm install        # first time only
npm run dev        # http://localhost:3001  (next dev -p 3001)
```

No env file of its own — the server routes read `SUPABASE_URL` + `SUPABASE_KEY`
(secret) from the **repo-root `.env`** (`../../.env`). The service key stays
server-side; the browser never sees it.

## Stack

Mirrors the principles app so there's one mental model:

- **Next.js 16.2.6** (App Router) + **React 19**
- **TypeScript**, **Tailwind CSS v4** (`@tailwindcss/postcss`)
- shadcn-style hand-rolled UI primitives (no shadcn CLI init), `lucide-react`
  icons, `clsx` + `tailwind-merge` (`cn` helper)

## Data source

Reads the Supabase `leads` table (built earlier — see `hubspot/leads_schema.sql`
and `hubspot/import_leads.mjs`). Columns: `email` (PK), `fname`, `lname`,
`domain`, `data` (JSONB — the full lead record incl. the `apollo` enrichment),
`updated_at`.

All access is **server-side over the Supabase REST API** (PostgREST). No direct
Postgres connection (that host is IPv6-only), no client-side Supabase, no RLS /
anon-key setup needed.

### Enriched vs cold (important gotcha)

A lead is "enriched" when it has an Apollo record. In the data, un-enriched rows
are stored as `apollo: null` — which is **JSON null, not SQL NULL**. So
`data->apollo=not.is.null` wrongly matches *every* row (the key exists).

The fix used everywhere: key off a sub-field that only exists on real
enrichments — `data->apollo->>id`:
- enriched: `data->apollo->>id=not.is.null`
- cold:     `data->apollo->>id=is.null`

Current data: **1,211 total · 65 enriched · 1,146 cold · 58 domains**.

## Layout

- **Full-width header** (`components/Header.tsx`) — logo + "Datawhistl / Leads
  database", sticky, spans the page.
- **Left sidebar** (`components/Sidebar.tsx`) — debounced search (name / email /
  domain), segment filters (All / Enriched / Cold with live counts), and an
  overview panel (total, enriched %, distinct domains). Hidden below `md`.
- **Right main area** (`app/page.tsx`) — results table (name, email, domain,
  title, status badge), 50/page pagination. Click a row to open the detail
  drawer.
- **Detail drawer** (`components/LeadDetail.tsx`) — right-side slide-over with the
  full Apollo enrichment: title, headline, LinkedIn link, employment-history
  timeline, and a collapsible raw-JSON view. Closes on Esc / backdrop click.

State (search `q`, `filter`, `page`, selected email) lives in `app/page.tsx` and
is passed down to the sidebar; the table/stats read from it.

## API routes

All three are server-only and proxy Supabase via `lib/supabase.ts` (`sb()` helper
that reads the repo-root `.env` and sets the `apikey` / `Authorization` headers).

| Route | Returns |
|---|---|
| `GET /api/leads?q=&filter=&page=` | Paginated list (50/page). Selects a lightweight projection — `email, fname, lname, domain, company, title, apollo_id` — never the full `data` blob. `filter` ∈ `all\|enriched\|cold`; `q` does an `ilike` OR across email/fname/lname/domain. Total count via PostgREST `Prefer: count=exact` → `content-range`. |
| `GET /api/leads/detail?email=` | The full row for one lead incl. the entire `data` JSONB (used by the drawer). |
| `GET /api/stats` | `{ total, enriched, cold, distinctDomains }` for the sidebar overview. |

## File map

```
hubspot/ui/
  package.json            # dev script pins -p 3001
  next.config.ts
  tsconfig.json
  postcss.config.mjs
  app/
    globals.css           # copied from the principles app (Tailwind v4 + theme vars)
    layout.tsx            # html/body + <Header/>
    page.tsx              # client shell: Sidebar + results table + pagination + drawer
    api/
      leads/route.ts          # list + search + filter + pagination
      leads/detail/route.ts   # full record by email
      stats/route.ts          # counts for the sidebar
  components/
    Header.tsx
    Sidebar.tsx
    LeadDetail.tsx
    ui/                   # card, badge, input, button (shadcn-style)
  lib/
    supabase.ts          # sb() REST helper, reads repo-root .env
    utils.ts             # cn()
```

## Notes / next steps

- Read-only today. Adding edit/delete would mean write routes (the secret key can
  already mutate) plus optimistic UI.
- Possible additions: column sorting, CSV export, a stats header bar in the main
  area, domain filter dropdown.
