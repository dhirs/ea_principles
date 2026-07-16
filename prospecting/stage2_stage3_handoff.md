# Stage 2 + 3 Handoff — Apollo pull → qualify → Supabase

Spec for running the acquire + qualify pass as a script (e.g. in Claude Code, which has a real filesystem and can call the Apollo API directly — no payload/temp-file limit). Method context: `methodology.md`; live state: `resume.md`; industry universe: `stage1_output.md`.

## Goal

Pull the full firmographic universe from Apollo, store it locally, apply the custom (non-API) filters, and load **qualified-only** rows into Supabase. Universe size unknown until re-tested — the earlier ~732 count was only the 4-code slice (333/335/326/423); the full 18-code list will be substantially larger.

## Stage 2 — Acquire (Apollo query)

Call Apollo's organization/mixed-companies search API directly with the account API key (see `.env`; do not echo it). All filters are native to Apollo, in two parts.

**Part 1 — base firmographics:**

| Filter | Value |
|---|---|
| `organization_naics_codes` | target sectors `11, 21, 22, 23, 31, 32, 33, 44, 45, 48, 49, 51, 52, 53, 54, 56, 61, 62, 71, 72` (2-digit codes for the 16 sectors in `stage1_output.md`; pass each digit of ranged sectors, e.g. 31/32/33, 44/45, 48/49) |
| `organization_locations` | `United States, Canada` |
| `organization_num_employees_ranges` | `201,500` and `501,1000` |
| `revenue_range` | `min 50000000, max 100000000` |
| `not_organization_naics_codes` | *(none)* — no standing exclusions; the target set is the 16 sectors as-is. |
| `per_page` | `100` |

**Part 2 — advanced native filters (ICP narrowing):**

| Filter | Value |
|---|---|
| `organization_department_or_subdepartment_counts` | `{ "master_marketing": { "min": 5, "max": 20 } }` — marketing team ~5–20 |

Technology filters are **not** in Stage 2 — they moved to **Stage 4** (weekly fit/propensity scoring).

Paginate `page` 1…N (total from `pagination.total_entries`).

- Endpoint (verify against current Apollo docs): `POST https://api.apollo.io/api/v1/mixed_companies/search`. Auth via `X-Api-Key` header or `api_key` in body.
- Pagination total is authoritative (`pagination.total_entries`); universe size TBD — the Part 2 filters (marketing dept + tech) will shrink it substantially.
- Cost: 1 credit per page returning results. Plan has ~2,500 lead credits, so the full sweep is trivial.
- **Store raw in `apollo_company_raw`:** upsert one row per company into a new Supabase table (no S3, no local files):

```sql
create table if not exists apollo_company_raw (
  id            bigint generated always as identity primary key,
  apollo_org_id text not null unique,
  payload       jsonb not null,            -- full Apollo record, verbatim
  last_refresh  timestamptz not null default now()
);
```

Upsert on `apollo_org_id`:

```sql
insert into apollo_company_raw (apollo_org_id, payload, last_refresh)
values ($1, $2, now())
on conflict (apollo_org_id)
do update set payload = excluded.payload, last_refresh = now();
```

Every pipeline run refreshes `payload` + `last_refresh`. Create the table only if it does not already exist (`create table if not exists`).

## Stage 3 — Qualify (custom filters)

Custom filters Apollo's API can't express. Tag every entry `qualified` / `flagged` / `dropped` with a reason.

- **Subsidiary of a parent → dropped.** `owned_by_organization_id` is non-null (parent name in `owned_by_organization.name`). This catches most subsidiaries (e.g. Blue River → John Deere, DAP → RPM, Bear Robotics → LG).
- **Brand-giant with null parent → flagged.** Name matches a known global brand even though `owned_by_organization_id` is null, often with revenue implausibly low for the brand (e.g. Canon Canada, Westinghouse Electric). Needs a name screen / manual confirm.
- **Primary-business mismatch → drop/verify.** Company matched a target sector via an incidental code while its actual core business is out of scope. Judgment call at Stage 3 — no query-level service exclusions, since Professional Services (54) and Admin/Support (56) are now in-scope target sectors.
- **Junk → dropped.** Staffing, media, directories.
- **Missing/ambiguous NAICS → flagged.** `naics_codes` empty or unclear → verify manually.
- **Revenue sanity → flagged.** Already in-band from the query; flag obviously mis-scoped values.

`matched_naics` = the first code in `naics_codes` whose 2-digit sector is in the Stage 1 target set.

## Outputs — two DB sinks

1. **Raw:** `apollo_company_raw` — one row per company, full `payload` jsonb, upserted on `apollo_org_id` with `last_refresh`. This is the full-superset audit trail (queryable in SQL — no separate local CSV needed; export one on demand for human review if wanted).
2. **Qualified:** `apollo_company_universe`, project `thnxknvcahqktpbpqvbg`. Upsert on `apollo_org_id`, `ON CONFLICT DO NOTHING`. Never insert flagged/dropped rows — they stay in `apollo_company_raw` only.

## Supabase table `apollo_company_universe` — field mapping

| Column | Type | Source (Apollo field) |
|---|---|---|
| `apollo_org_id` | text (conflict key) | `id` |
| `company` | text | `name` |
| `domain` | text | `primary_domain` |
| `linkedin_url` | text | `linkedin_url` |
| `employee_range` | text | employee-count field / query bucket |
| `revenue` | numeric | `organization_revenue` |
| `revenue_printed` | text | `organization_revenue_printed` |
| `naics` | text[] | `naics_codes` |
| `hq_location` | text | org city/state/country |
| `parent_company` | text | `owned_by_organization.name` (null if independent) |
| `growth_6m` / `12m` / `24m` | numeric | `organization_headcount_six/twelve/twenty_four_month_growth` |
| `raw_ref` | text | `apollo_org_id` of the source `apollo_company_raw` row |
| `products` | jsonb | `{"cdp-selection":{"status":"qualified","reason":"...","matched_naics":"333","added":"<date>"}}` |
| `added_at` | timestamptz | now() |

After inserting qualified rows, **backfill the denormalised NAICS columns** (`matched_naics_title`, `matched_naics_sector`, `naics_titles[]`, and the 10 hierarchy columns: sector / subsector / industry_group / naics_industry / national_industry code+title) from the static `apollo_naics` reference table — derive each level's code by prefix length and LEFT JOIN `apollo_naics` for titles. See `naics_reference/README.md`.

## Score columns (Stage 4 / 5)

Stages 4 and 5 write account-level scores back to `apollo_company_universe`. Add these columns **only if they are not already present** — use idempotent DDL (`ADD COLUMN IF NOT EXISTS`), never blind `ADD COLUMN`:

| Column | Type | Written by |
|---|---|---|
| `propensity_score` | numeric | Stage 4 (weekly fit/propensity rule engine) |
| `propensity_scored_at` | timestamptz | Stage 4 |
| `intent_score` | numeric | Stage 5 (behavioural intent pipeline) |
| `intent_scored_at` | timestamptz | Stage 5 |

Example: `ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS propensity_score numeric;` (repeat per column).

## Non-negotiables

- Confirm the exact filter set before spending Apollo credits; a modified query needs fresh approval.
- Never use a locked filter that errors on the plan; prune from results if needed.
- `apollo_company_universe` = qualified rows only; `apollo_company_raw` keeps the full swept set.
- Show real hit rates; flag data-quality problems, don't hide them.
- Don't echo secrets from `.env`.
