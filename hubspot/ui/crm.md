# CRM — Leads UI

A standalone Next.js app for browsing + lightly editing the `leads` table in
Supabase. Lives in `hubspot/ui/`, separate from the principles app (port 3000).
This one runs on **port 3001**.

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
- **macOS system font** (San Francisco) via the native `-apple-system` stack in
  `app/globals.css` — no web-font download. Logo is the principles app's
  `logo.png` (`public/img/logo.png`).

## Data source

Reads the Supabase `leads` table (see `hubspot/leads_schema.sql` and
`hubspot/import_leads.mjs`). Columns:

- `email` (PK), `fname`, `lname`, `domain`, `updated_at`
- `data` (JSONB) — the full lead record incl. the `apollo` enrichment
- `seg_override` (text, nullable) — **manual** seniority override; `null` = Auto.
  `CHECK (seg_override in ('Senior','Mid','Entry','Unknown'))`.
- `seg` (text, **generated / read-only**) = `coalesce(seg_override, <title-inferred
  bucket>)`. Never write to it — it recomputes itself; writing errors.

All access is **server-side over the Supabase REST API** (PostgREST). No direct
Postgres connection (that host is IPv6-only), no client-side Supabase, no RLS /
anon-key setup needed.

### Enriched vs cold (important gotcha)

A lead is "enriched" when it has an Apollo record. Un-enriched rows store
`apollo: null` — which is **JSON null, not SQL NULL**. So
`data->apollo=not.is.null` wrongly matches *every* row (the key exists). Key off
a sub-field that only exists on real enrichments instead — `data->apollo->>id`:
- enriched: `data->apollo->>id=not.is.null`
- cold:     `data->apollo->>id=is.null`

Current data: **1,211 total · 65 enriched · 1,146 cold**.

## Layout

- **Full-width header** (`components/Header.tsx`) — `logo.png` + "Leads database",
  sticky, spans the page.
- **Left sidebar** (`components/Sidebar.tsx`) — debounced search (name / email /
  domain), **Segment** filter (All / Enriched / Cold with live counts), a
  **Seniority** dropdown (Auto / Senior / Mid / Entry — filters the `seg` column),
  and an overview panel (total, enriched %, cold). Hidden below `md`.
- **Right main area** (`app/page.tsx`) — results table with columns **Email ·
  First name · Last name · Company · Title**, `table-fixed` so long titles wrap
  inside the panel. **10 rows/page**, sorted newest-first (`updated_at desc`).
  Click a row to open the detail drawer.
- **Detail drawer** (`components/LeadDetail.tsx`) — right-side slide-over:
  - **Seniority control** (see below) near the top.
  - Domain rendered as a link to the company site.
  - Apollo person fields: title, location, headline, LinkedIn.
  - **Organization panel** (when the `apollo.organization` node is present):
    company name, industry, employees, founded year, HQ location, phone, website
    link, company LinkedIn, raw address.
  - Employment-history timeline + a collapsible raw-JSON view.
  - Closes on Esc / backdrop click.

Name + company prefer the Apollo node (`apollo.first_name/last_name`,
`apollo.organization.name`) and fall back to the top-level columns.

State (search `q`, `filter`, `seg`, `page`, selected email) lives in
`app/page.tsx` and is passed down to the sidebar; the table/stats read from it.

## Seniority: filter + manual override

Two distinct things, both around the `seg` / `seg_override` columns:

1. **Filter** (sidebar dropdown) — narrows the list to `seg=eq.<value>`. Hardcoded
   values Senior / Mid / Entry; "All seniority" clears it.
2. **Override** (detail drawer) — a `<select>` (Auto / Senior / Mid / Entry /
   Unknown) initialised from the lead's `seg_override`. On change it PATCHes
   `seg_override` (NOT `seg`) and shows the recomputed `seg` as a badge beside it,
   labelled **"(auto)"** when no override is set. Optimistic update with
   Saving…/Saved ✓/Failed states; reverts on error. **"Auto" sends JSON `null`**
   (not the string `"null"`) to revert to the title-inferred value. On success the
   list row refreshes (`onUpdated` → refetch) so its badge updates.

Only ever write `seg_override`. The importer (`import_leads.mjs`) upserts just
`email/fname/lname/domain/data`, so manual overrides survive a re-import untouched.

## API routes

All server-only; proxy Supabase via `lib/supabase.ts` (`sb()` helper reads the
repo-root `.env`, sets `apikey` / `Authorization`; takes an optional
`{ method, body }` for writes).

| Route | Returns |
|---|---|
| `GET /api/leads?q=&filter=&seg=&page=` | Paginated list (**10/page**, `updated_at desc`). Lightweight projection — `email, fname, lname, domain, seg, seg_override, company, title, apollo_id, a_fname, a_lname, a_company` — never the full `data` blob. `filter` ∈ `all\|enriched\|cold`; `seg` ∈ `Senior\|Mid\|Entry\|Unknown`; `q` does an `ilike` OR across email/fname/lname/domain. Total via `Prefer: count=exact` → `content-range`. Cached 60s (`unstable_cache`, tag `leads`) + `Cache-Control`. |
| `GET /api/leads/detail?email=` | Full row for one lead incl. `seg`, `seg_override`, and the entire `data` JSONB (drawer). |
| `PATCH /api/leads/seg` | Body `{ email, seg_override }` where `seg_override` ∈ `Senior\|Mid\|Entry\|Unknown` or `null`; validated server-side (400 otherwise). PATCHes `…?email=eq.<email>` with `Prefer: return=representation`, `revalidateTag("leads")`, returns the recomputed row (incl. generated `seg`). Never writes `seg`. |
| `GET /api/stats` | `{ total, enriched, cold }` — header-only `count=exact` queries (no rows transferred). Cached 60s. |

## File map

```
hubspot/ui/
  package.json            # dev script pins -p 3001
  next.config.ts
  tsconfig.json
  postcss.config.mjs
  app/
    globals.css           # Tailwind v4 + theme vars; macOS system font stack
    layout.tsx            # html/body + <Header/>
    page.tsx              # client shell: Sidebar + results table + pagination + drawer
    api/
      leads/route.ts          # list + search + filter (filter/seg) + pagination + cache
      leads/detail/route.ts   # full record by email
      leads/seg/route.ts      # PATCH seg_override (manual seniority override)
      stats/route.ts          # counts for the sidebar
  components/
    Header.tsx
    Sidebar.tsx           # search + segment filter + seniority dropdown + overview
    LeadDetail.tsx        # drawer: seniority override, org panel, company link, raw JSON
    ui/                   # card, badge, input, button (shadcn-style)
  lib/
    supabase.ts          # sb() REST helper (GET + writes), reads repo-root .env
    utils.ts             # cn()
  public/img/logo.png
```

## Notes / next steps

- Writes today: seniority override only. Adding edit/delete of other fields would
  follow the same PATCH-route pattern.
- Possible additions: column sorting, CSV export, a stats header bar, domain
  filter dropdown.
