# Stage 2 — Acquire (Implementation)

How to run Stage 2. Concept: `methodology.md`. Input: `stage1_output.md`. Next: `stage3_qualify.md`. State: `README.md`.

Run the Stage 1 inputs as the Apollo query and store every result verbatim in `apollo_company_raw`. **This is where the query happens** — Stage 1 only collected the inputs. No qualifying, no field mapping.

## Goal

One row per company, full Apollo record untouched, upserted into `apollo_company_raw`. This table is the **durable superset** — it keeps everything, including companies Stage 3 later flags or drops, so a qualification mistake never costs credits to fix.

## The query

`POST https://api.apollo.io/api/v1/mixed_companies/search` (or the Apollo MCP's `apollo_mixed_companies_search`). Auth via `X-Api-Key` header or `api_key` in body — key is in `.env`; **never echo it**.

Apply `stage1_output.md` as native filters, in two parts:

| Part | Filter | Notes |
|---|---|---|
| 1 — base firmographics | `organization_naics_codes` | 2-digit sectors. **Pass each digit of a ranged sector separately** — Manufacturing is `31`,`32`,`33`; Retail `44`,`45`; Transport `48`,`49`. Not `31-33`. |
| | `organization_locations` | HQ location. |
| | `organization_num_employees_ranges` | e.g. `201,500` and `501,1000`. |
| | `revenue_range` | `{min, max}`, no symbols or commas. |
| | `not_organization_naics_codes` | Default **none** — see `stage1_requirements.md`. |
| 2 — native ICP | `organization_department_or_subdepartment_counts` | e.g. `{"master_marketing": {"min": 5, "max": 20}}`. **Use exact known department keys — an unrecognised key is accepted silently and returns nothing rather than erroring.** |
| | `per_page` | `100` (max). |

**Technology filters are NOT in Stage 2** — they belong to Stage 4. See the table in `stage1_requirements.md` for why.

## Procedure

1. **Confirm the exact filter set with the user before spending anything.** A modified query needs fresh approval.
2. **Probe with `per_page: 1`** to read `pagination.total_entries` — that count is authoritative and sizes the sweep. 1 credit.
3. **Confirm the total page count and credit cost upfront** (1 credit per page returning results; 0 if no matches).
4. **Paginate `page` 1…N**, saving each raw response to `apollo_companies/<date>/page-N.json`.
5. **Persist `breadcrumbs`** (see below).
6. **Load** with `stage2_load.py` — reads the page captures and upserts over PostgREST, batching 100 rows, deduping across pages. `python3 stage2_load.py [<dir>] [--dry-run]`.
7. **Record the result in `README.md`**: universe size, date, credits spent, anything reconstructed or degraded.

## Persist `breadcrumbs` — the only audit trail

Apollo echoes the filters it **actually applied** in a top-level `breadcrumbs` array. Save it beside the page captures.

Without it, a snapshot holds only `pagination` + `organizations` — the *results* but not the *query*. "Was the location filter applied?" then becomes unanswerable from the stored data and costs credits to re-test (it did, on 2026-07-17). `breadcrumbs` makes the sweep self-documenting for free.

## Know which filters leave no trace

The company-search response carries **only** these fields:

`id`, `name`, `primary_domain`, `website_url`, `linkedin_url`, `linkedin_uid`, `naics_codes`, `sic_codes`, `organization_revenue`, `organization_revenue_printed`, `owned_by_organization_id` (+ `owned_by_organization` when set), `organization_headcount_six/twelve/twenty_four_month_growth`, `founded_year`, `phone` / `primary_phone` / `sanitized_phone`, `alexa_ranking`, `languages`, intent placeholders (`intent_strength`, `show_intent`, `has_intent_signal_account`, `intent_signal_account`), `publicly_traded_symbol` / `_exchange`, `market_cap` (rare), and social/logo URLs.

**Absent: any location field and any employee-count field.** So the geography and headcount filters constrain the pull but leave **no evidence on the stored rows** — no later SQL can confirm them, and no universe column can honestly be sourced from them. Verify those at the query level (below). Populating real HQ/headcount data needs a per-org enrich call at ~1 credit *each*.

## Verifying a query-level filter (2 credits)

For any filter invisible in the payload:

1. Re-run the documented query → total should match the recorded universe size (allow small day-over-day drift; Apollo's index moves — 3,816 → 3,815 overnight is normal).
2. Re-run **without** the filter → total should be materially larger.

A meaningful gap proves the filter was live during the sweep. Use `per_page: 1` — cost is 1 credit per request regardless of page size, and only the total matters. Cross-check `breadcrumbs`, which names every filter applied.

## Table

```sql
create table if not exists apollo_company_raw (
  id               bigint generated always as identity primary key,
  apollo_org_id    text not null unique,
  payload          jsonb not null,            -- Stage 2 SEARCH record, verbatim (thin — no technographics/funding)
  last_refresh     timestamptz not null default now(),
  -- Stage 4 enrichment columns (added 2026-07-17). Null until the org is enriched.
  enriched_payload jsonb,                      -- full organizations_enrich record, verbatim
  last_enriched    timestamptz,                -- when enrichment last ran for this org
  enrichment_query jsonb                       -- the discover filter set (fields+values) that surfaced this org
);

-- Existing table: additive, safe, idempotent migration.
alter table apollo_company_raw
  add column if not exists enriched_payload jsonb,
  add column if not exists last_enriched    timestamptz,
  add column if not exists enrichment_query jsonb;
```

**Two payloads, two columns.** `payload` stays the thin Stage 2 search row; Stage 4 writes the full enrichment record to `enriched_payload` and never touches `payload`. `enrichment_query` gives each enriched row its own provenance — the same self-documenting idea as `breadcrumbs`, but per row.

Upsert on `apollo_org_id`; every run refreshes `payload` + `last_refresh`:

```sql
insert into apollo_company_raw (apollo_org_id, payload, last_refresh)
values ($1, $2, now())
on conflict (apollo_org_id)
do update set payload = excluded.payload, last_refresh = now();
```

`create table if not exists` — create only if absent.

## Store layout — `apollo_companies/<date>/`

Date-partitioned point-in-time snapshot of every swept company (the full superset):

- `page-N.json` — raw captures, 100 companies/page, all fields verbatim.
- `breadcrumbs.json` — the filters Apollo applied (add this going forward).

**Not the Stage 3 source.** Stage 3 reads `apollo_company_raw` in SQL, not these files. The JSON is a human-inspectable archive.

## Cadence & ops

- On demand / on refresh. The upsert is idempotent — re-running is safe and just refreshes payloads.
- Display limit is 50,000 records (100/page × 500 pages). Add filters if a sweep approaches it.
- **Never use a locked filter that errors on the plan**; prune from results instead.
- Flag data-quality problems in `README.md` — never hide them. If any page had to be reconstructed rather than captured verbatim, say so and note it is re-fetchable for 1 credit.
