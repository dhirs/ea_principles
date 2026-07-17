# CRM — Leads + Events + Companies + Reports

Our own CRM (not HubSpot — the `hubspot/` folder name is a legacy misnomer; there
is zero HubSpot API in here, it's all Supabase). A standalone Next.js app for
browsing/editing `leads`, managing lightning-lesson `events` + `attendance`, and
browsing the Apollo target-company universe. Lives in `hubspot/ui/`, separate from
the principles app (port 3000). This one runs on **port 3001**.

**Four pages**, all behind a login gate: **Leads** (`/`), **Events** (`/events`),
**Companies** (`/companies`), **Reports** (`/reports`).

## Auth (login gate)

`middleware.ts` gates **everything** except `/login` and `/api/auth/*` (static assets
excluded via `matcher`). Unauthenticated: API routes get `401 {error:"unauthorized"}`,
pages redirect to `/login?next=<path>`. Single hardcoded user — `checkCredentials()`
in `lib/auth.ts` compares against `AUTH_EMAIL` / `AUTH_PASSWORD`; the session is a
signed token in a cookie (`COOKIE_NAME`), created by `createSessionToken()` and
checked by `verifySessionToken()`. `CRM_SESSION_SECRET` lives in the repo-root `.env`.
Build/run/deploy + env details: **`hubspot/BUILD.md`**.

> Hitting an API route with curl returns **401**, not data — that means the gate is
> working, *not* that the server is down. Log in via `POST /api/auth/login` first.

## Run

```bash
cd hubspot/ui
npm install        # first time only
npm run dev        # http://localhost:3001  (next dev -p 3001)
```

Or from the repo root: `./scripts/start_supabase_ui.sh`.

No env file of its own — the server routes read `SUPABASE_URL` + `SUPABASE_KEY`
(secret) from the **repo-root `.env`** (`../../.env`). The service key stays
server-side; the browser never sees it.

## Stack

- **Next.js 16.2.6** (App Router) + **React 19**
- **TypeScript**, **Tailwind CSS v4** (`@tailwindcss/postcss`)
- shadcn-style hand-rolled UI primitives (no shadcn CLI init), `lucide-react`
  icons, `clsx` + `tailwind-merge` (`cn` helper)
- **macOS system font** (San Francisco) via the native `-apple-system` stack in
  `app/globals.css`. Logo is the principles app's `logo.png`.

## Data model

Four tables, all accessed **server-side over the Supabase REST API** (PostgREST).
No direct Postgres connection (that host is IPv6-only), no client-side Supabase.

> ### PostgREST caps every response at 1,000 rows (`max-rows`) — read this before adding a route
>
> A plain `select` returns **at most 1,000 rows with a `200 OK`** and no warning. Any
> route that intends to return a whole table **must page** with `limit`/`offset` until a
> short read, like `/api/reports/attendance` and `/api/companies` do:
>
> ```ts
> const PAGE = 1000;
> for (let offset = 0; ; offset += PAGE) {
>   const res = await sb(table, `${base}&limit=${PAGE}&offset=${offset}`);
>   const batch = await res.json();
>   rows.push(...batch);
>   if (batch.length < PAGE) break;
> }
> ```
>
> This bit `/api/companies` (fixed 2026-07-17): it fetched unbounded and ordered by
> `revenue.desc`, so the page silently showed **the top 1,000 of 2,983** companies —
> and because every count was computed client-side off that array, the UI looked
> perfectly healthy while a third of the universe was missing. The same 1,000 cap
> applies to the **Supabase Studio table editor**, so "1000" there is a pagination
> limit, never a row count — confirm with `select count(*)`.

### `leads` (see `hubspot/leads_schema.sql`)
- `email` (PK), `fname`, `lname`, `domain`, `updated_at`
- `data` (JSONB, NOT NULL) — full lead record incl. the `apollo` enrichment.
  Shape: `{email, apollo, source:{name,type,channel}, company, first_name,
  last_name, signup_date}`. Maven leads use `source.type =
  "maven_lightning_session"`, `source.name = <lesson slug>`.
- `seg_override` (text, nullable) — **manual** seniority override; `null` = Auto.
  `CHECK (seg_override in ('Senior','Mid','Entry','Unknown'))`.
- `seg` (text, **generated / read-only**) = `coalesce(seg_override, <title-inferred
  bucket>)`. Never write to it — it recomputes itself; writing errors.

### `maven_events`
One row per lightning lesson / workshop.
- `id` (uuid PK, `gen_random_uuid()`), `event_name` (NOT NULL),
  `date_of_event` (date, nullable), `event_url`, `event_description`, `created_at`.

### `maven_attendance`
One row per (event, lead) — a lead's signup/attendance for an event.
- `id` (uuid PK), `event_id` → `maven_events(id)` **ON DELETE CASCADE**,
  `lead_email` → `leads(email)` **ON DELETE CASCADE**, `created_at`.
- `signup_date` (date) — when the lead signed up.
- `source` (text) — e.g. `workshop_list_join`, `post_workshop_list_join`.
- `attended` (bool) — attended at all (CSV `Attended` 0/1).
- `attended_live` (bool) — attended live (CSV `Attended live` Yes/No).
- `UNIQUE (event_id, lead_email)`; indexed on `event_id` and `lead_email`.
- **Note:** `leads` has no numeric id — its PK is `email`, so attendance links by
  `lead_email`, not a `lead_id`.

### `apollo_company_universe` (read-only here)

The **Apollo target-company universe** — built by the `prospecting/` workstream, not by
this app. The CRM only reads it; nothing here writes to it. **`prospecting/README.md`
is the source of truth** for how it's built and what's currently in it.

- `apollo_org_id` (PK), `company`, `domain`, `linkedin_url`, `revenue`,
  `revenue_printed`, `naics` (text[]), `parent_company`, `growth_6m` / `_12m` / `_24m`,
  `added_at`, `products` (jsonb — per-service `{status, reason, matched_naics, added}`).
- Denormalised NAICS: `matched_naics_title`, `matched_naics_sector`, `naics_titles[]`,
  and the 5 hierarchy levels the UI filters on — `sector_title`, `subsector_title`,
  `industry_group_title`, `naics_industry_title`, `national_industry_title` (+ their
  `*_code` twins).
- `propensity_score` / `intent_score` (+ `*_scored_at`) — written by prospecting
  Stages 4/5, not yet surfaced in the UI.
- **`hq_location` and `employee_range` are empty/placeholder by design** — Apollo's
  company-search returns no location or headcount fields. The Companies table renders
  them, so they read blank. Populating them needs a per-org Apollo enrich (~1 credit
  each). See `prospecting/stage3_qualify.md`.

Current data: **2,983 companies** (2026-07-17).

### Enriched vs cold (important gotcha)

A lead is "enriched" when it has an Apollo record. Un-enriched rows store
`apollo: null` — **JSON null, not SQL NULL**. So `data->apollo=not.is.null`
wrongly matches *every* row (the key exists). Key off a sub-field instead —
`data->apollo->>id`:
- enriched: `data->apollo->>id=not.is.null`
- cold:     `data->apollo->>id=is.null`

Current data: **1,473 leads · 65 enriched · 1,408 cold · 3 events · 1,502 attendance**.

## Importing records (Maven CSV → Supabase)

`hubspot/load_maven_attendance.py` imports the lightning-lesson signups/attendance
CSV (from `uploads/`) into all three tables, **all via the PostgREST URL** (never
psql — see the leads-upsert convention). Idempotent; safe to re-run. It:

1. **Events** — collects distinct `(Lesson Title, Lesson URL)`, reuses any existing
   `maven_events` row (matched by `event_url`), creates the rest.
2. **Leads** — dedupes incoming by email (keeps earliest signup), inserts with
   `Prefer: resolution=ignore-duplicates` + `?on_conflict=email` so **existing
   apollo-enriched rows are never overwritten** — only genuinely new emails insert.
   New Maven leads are email-only (`data.apollo = null`, empty names).
3. **Attendance** — dedupes by `(event, email)` (prefers an `attended=1` row),
   upserts with `Prefer: resolution=merge-duplicates` +
   `?on_conflict=event_id,lead_email`, so re-runs refresh the attended flags.

CSV columns → mapping: `Email→lead_email`, `Lesson Title→event_name`,
`Lesson URL→event_url`, `Signup Date→signup_date` (`"Jun 30, 2026"` parsed),
`Source→source`, `Attended→attended`, `Attended live→attended_live`.

## Layout

- **Full-width header** (`components/Header.tsx`) — logo + "Leads database", sticky.
- **Left menu** (`components/NavPanel.tsx`) — slim: **Leads** (`/`), **Events**
  (`/events`), **Companies** (`/companies`), **Reports** (`/reports`).
  Clicking the already-active item fires `onActiveClick` instead of navigating
  (used on the leads page to toggle the filters panel). Hidden below `md`.
- **Leads filters** (`components/LeadsFilters.tsx`) — a *separate* toggleable panel
  shown next to the menu on the leads page only: debounced search (name / email /
  domain), **Segment** filter (All / Enriched / Cold + live counts), **Seniority**
  dropdown, overview (total / enriched % / cold). Toggle via the Leads menu item,
  the header "Filters" button, or the panel's ✕.
- **Leads table** (`app/page.tsx`) — columns **Email · First name · Last name ·
  Company · Title**, `table-fixed` so long values wrap. **10 rows/page**, newest
  first (`updated_at desc`). Click a row for the detail drawer.
- **Detail drawer** (`components/LeadDetail.tsx`) — right slide-over: seniority
  override, domain link, Apollo person fields, organization panel, employment
  timeline, raw-JSON view. Closes on Esc / backdrop click.
- **Events page** (`app/events/page.tsx`) — table of events with **New / Edit /
  Delete**. Add/edit via a modal dialog (name required; date, URL, description).
  Delete confirms, and cascades to that event's attendance rows.
- **Companies page** (`app/companies/page.tsx`) — read-only browse of
  `apollo_company_universe`. Fetches **every** row once from `/api/companies`, then does
  search, filtering, sorting, and pagination **client-side**. Columns: **Company ·
  Employees · Revenue · 6m · 12m**. Debounced search; page sizes **25 / 50 / 75 / 100**;
  sortable numeric columns (`revenue`, `growth_6m`, `growth_12m`); default order is
  biggest revenue first, nulls last, then A→Z. Growth values are stored as fractions and
  rendered as percentages (`0.12` → `+12.0%`).
  Clicking the **company name opens the detail drawer** — it does *not* navigate out.
- **Filters panel** (on the companies page) — two filters, both client-side:
  - **Revenue ($M)** — min/max inputs; blank is open-ended. Typed in **millions**, matched
    against the dollar-valued `revenue` column (`80` → `80_000_000`). A row with null
    revenue never matches a bound.
  - **Five cascading NAICS dropdowns** (Sector → Subsector → Industry Group → NAICS
    Industry → National Industry) — picking a level clears every level below it.
  Options are **faceted**: each dropdown's choices reflect the search + the revenue range
  + the *other* active levels, so a selection can never produce an empty list. Any change
  resets to page 1; "Clear all" resets every filter.
- **Company drawer** (`components/CompanyDetail.tsx`) — right slide-over, same pattern as
  `LeadDetail` (Esc / backdrop to close). **Takes the already-fetched row as a prop —
  no API call.** Shows the full NAICS hierarchy (all 5 levels), revenue, headcount growth
  6/12/24m (green/red by sign), parent company, added date, `apollo_org_id`, and outbound
  links to the domain + LinkedIn. It owns the exported `CompanyRow` type, which the page
  imports.

> **Dead columns — `hq_location` and `employee_range`.** `hq_location` was removed from
> the table on 2026-07-17: it is null on **all** rows because Apollo's company-search
> returns no location field. **`employee_range` is in exactly the same state** — it reads
> `'201-1000'` on all 2,983 rows because Stage 3 hardcoded the query bucket into it, so
> the Employees column carries zero information and is a candidate for the same removal.
> Real values for either need a per-org Apollo enrich (~1 credit each).
- **Reports page** (`app/reports/page.tsx`) — tabbed shell; add a report by appending to
  the `REPORTS` array. Today there is one: **Maven Attendance**
  (`components/reports/MavenAttendanceReport.tsx`) — pick an event, see every
  signup/attendance record with the lead's name/company/title flattened off the FK,
  an **enriched-only** toggle, client-side search, page sizes **10 / 50 / 100**, and a
  row click that opens the lead.

Name + company prefer the Apollo node and fall back to the top-level columns.

## Seniority: filter + manual override

Two things around `seg` / `seg_override`:

1. **Filter** (LeadsFilters dropdown) — narrows to `seg=eq.<value>`. Senior / Mid /
   Entry; "All seniority" clears it.
2. **Override** (detail drawer) — a `<select>` (Auto / Senior / Mid / Entry /
   Unknown) init from `seg_override`. On change it PATCHes `seg_override` (NOT
   `seg`) and shows the recomputed `seg` badge, "(auto)" when unset. Optimistic;
   reverts on error. **"Auto" sends JSON `null`** (not `"null"`). On success the
   list row refetches.

Only ever write `seg_override`. Importers upsert just `email/fname/lname/domain/
data`, so manual overrides survive a re-import untouched.

## API routes

All server-only; proxy Supabase via `lib/supabase.ts` (`sb()` helper reads the
repo-root `.env`, sets `apikey` / `Authorization`; takes optional `{ method, body }`).

| Route | Returns |
|---|---|
| `GET /api/leads?q=&filter=&seg=&page=` | Paginated list (**10/page**, `updated_at desc`). Lightweight projection (never the full `data` blob). `filter` ∈ `all\|enriched\|cold`; `seg` ∈ `Senior\|Mid\|Entry\|Unknown`; `q` = `ilike` OR across email/fname/lname/domain. Total via `Prefer: count=exact`. Cached 60s (tag `leads`). |
| `GET /api/leads/detail?email=` | Full row for one lead incl. `seg`, `seg_override`, entire `data` JSONB. |
| `PATCH /api/leads/seg` | Body `{ email, seg_override }` (∈ buckets or `null`; validated 400). PATCHes by email, `revalidateTag("leads")`, returns recomputed row. Never writes `seg`. |
| `GET /api/stats` | `{ total, enriched, cold }` — header-only `count=exact` queries. Cached 60s. |
| `GET /api/events` | All events, `date_of_event desc nullslast`. `no-store`. |
| `POST /api/events` | Create. Body `{ event_name*, date_of_event, event_url, event_description }`. 201 with the new row. |
| `PATCH /api/events/[id]` | Update (partial; id validated as uuid). 404 if missing. |
| `DELETE /api/events/[id]` | Delete by id (cascades to `maven_attendance`). |
| `GET /api/companies` | **Every** row of `apollo_company_universe` (read-only), `revenue desc nullslast, company asc`. **Pages through `limit`/`offset` in a loop** — a single request would silently cap at 1,000. `{ rows }`, `no-store`. |
| `GET /api/reports/attendance?event_id=` | All attendance for one event (uuid validated → 400), lead name/company/title embedded off the FK. Pages through `limit`/`offset`. Returns `{ count, attended, records }`, `no-store`. |
| `POST /api/auth/login` | Body `{ email, password }` → sets the session cookie. 401 on bad credentials. **Open** (not gated). |
| `POST /api/auth/logout` | Clears the session cookie. **Open** (not gated). |

## File map

```
hubspot/
  load_maven_attendance.py    # CSV -> events + leads + attendance (PostgREST)
  load_leads_supabase.py      # earlier leads-only loader
  leads_schema.sql
  ui/
    middleware.ts             # login gate: everything except /login + /api/auth/*
    app/
      globals.css
      layout.tsx              # html/body + <Header/>
      page.tsx                # leads: NavPanel + LeadsFilters + table + drawer
      login/page.tsx          # login form
      events/page.tsx         # events CRUD (table + add/edit/delete dialog)
      companies/page.tsx      # Apollo universe: NAICS filters, sort, pagination
      reports/page.tsx        # tabbed report shell (REPORTS array)
      api/
        auth/login/route.ts   # POST login -> session cookie (open)
        auth/logout/route.ts  # POST logout (open)
        leads/route.ts        # list + search + filter + pagination + cache
        leads/detail/route.ts # full record by email
        leads/seg/route.ts    # PATCH seg_override
        stats/route.ts        # sidebar counts
        events/route.ts       # GET list, POST create
        events/[id]/route.ts  # PATCH update, DELETE
        companies/route.ts    # full apollo_company_universe (paged loop)
        reports/attendance/route.ts  # per-event attendance (paged loop)
    components/
      Header.tsx
      NavPanel.tsx            # slim left menu: Leads / Events / Companies / Reports
      LeadsFilters.tsx        # toggleable leads filter panel
      LeadDetail.tsx          # lead drawer
      CompanyDetail.tsx       # company drawer (+ exports the CompanyRow type)
      reports/MavenAttendanceReport.tsx
      ui/                     # card, badge, input, button
    lib/
      supabase.ts            # sb() REST helper, reads repo-root .env
      auth.ts                # credential check + session token sign/verify
      utils.ts               # cn()
    public/img/logo.png
```

## Notes / next steps

- Writes today: seniority override, events CRUD. Attendance is import-only so far —
  no in-UI editing of attendance yet.
- The `hubspot/` folder is a legacy name; a rename to `crm/` is possible but touches
  script paths + the `../../.env` resolution in `lib/supabase.ts` and the loaders.
- Possible additions: an attendance view per event/lead, column sorting, CSV export.
```
