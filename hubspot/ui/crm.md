# CRM — Leads + Events

Our own CRM (not HubSpot — the `hubspot/` folder name is a legacy misnomer; there
is zero HubSpot API in here, it's all Supabase). A standalone Next.js app for
browsing/editing `leads` and managing lightning-lesson `events` + `attendance` in
Supabase. Lives in `hubspot/ui/`, separate from the principles app (port 3000).
This one runs on **port 3001**.

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

Three tables, all accessed **server-side over the Supabase REST API** (PostgREST).
No direct Postgres connection (that host is IPv6-only), no client-side Supabase.

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
- **Left menu** (`components/NavPanel.tsx`) — slim, only **Leads** and **Events**.
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

## File map

```
hubspot/
  load_maven_attendance.py    # CSV -> events + leads + attendance (PostgREST)
  load_leads_supabase.py      # earlier leads-only loader
  leads_schema.sql
  ui/
    app/
      globals.css
      layout.tsx              # html/body + <Header/>
      page.tsx                # leads: NavPanel + LeadsFilters + table + drawer
      events/page.tsx         # events CRUD (table + add/edit/delete dialog)
      api/
        leads/route.ts        # list + search + filter + pagination + cache
        leads/detail/route.ts # full record by email
        leads/seg/route.ts    # PATCH seg_override
        stats/route.ts        # sidebar counts
        events/route.ts       # GET list, POST create
        events/[id]/route.ts  # PATCH update, DELETE
    components/
      Header.tsx
      NavPanel.tsx            # slim left menu: Leads / Events
      LeadsFilters.tsx        # toggleable leads filter panel
      LeadDetail.tsx          # drawer
      ui/                     # card, badge, input, button
    lib/
      supabase.ts            # sb() REST helper, reads repo-root .env
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
