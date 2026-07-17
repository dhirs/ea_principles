# Stage 3 — Qualify (Implementation)

How to run Stage 3. Concept: `methodology.md`. Input: `apollo_company_raw` (see `stage2_acquire.md`). Output: `apollo_company_universe`. State: `README.md`.

Apply the filters the Apollo query **cannot express**. Pure SQL over data already pulled — **free, no credits**, so iterate freely.

## Goal

Screen every raw row to `qualified` / `flagged` / `dropped` with a reason, insert **qualified only** into `apollo_company_universe`, then backfill the denormalised NAICS columns. Flagged and dropped rows stay in `apollo_company_raw` as the audit trail — never insert them.

## Before you start: clear a superseded set

The insert uses `ON CONFLICT DO NOTHING`, which is safe to re-run but **will not remove rows from an earlier query**. After any ICP change, stale rows otherwise sit alongside fresh ones, indistinguishable by `count(*)`.

```sql
delete from apollo_company_universe;   -- only when the ICP/query changed
```

Look at what you're deleting first (`added_at`, `products->'<service>'->>'reason'`) and confirm it's genuinely stale. `apollo_company_raw` is the durable superset, so a wrong Stage 3 is always replayable — **never edit raw to fix a Stage 3 mistake.**

## `matched_naics` — derive once, reuse

**The first code in `naics_codes` whose 2-digit sector is in the Stage 1 target set.** It drives the reason, the junk screen, and every denormalised title. Compute it in a CTE:

```sql
(select c from jsonb_array_elements_text(payload->'naics_codes') c
  where left(c,2) in (<target sectors>)
  limit 1) as matched_naics
```

## The screens

Cheap deterministic screens first, judgment last.

| # | Screen | Rule | Disposition |
|---|---|---|---|
| 1 | **Subsidiary** | `payload->>'owned_by_organization_id'` is non-null (parent name in `owned_by_organization.name`) | dropped — sell to the decision-making entity, not the sub |
| 2 | **Missing identity** | `primary_domain` is null | dropped (flag) — unusable for outreach |
| 3 | **Off-target NAICS** | `matched_naics` is null, or `naics_codes` empty | dropped |
| 4 | **Junk** | `matched_naics` is a known junk line of business — staffing (`5613`), directories | dropped |
| 5 | **Revenue sanity** | outside the Stage 1 band | flagged — signals a mis-scoped record |
| 6 | **Brand-giant, null parent** | name matches a global brand yet `owned_by_organization_id` is null, often with revenue implausibly low for the brand | flagged — screen 1 missed it; confirm by hand |
| 7 | **Primary-business mismatch** | matched a target sector on an incidental code while its core business is out of scope | drop/verify — judgment |

Screens 1–4 are deterministic. **Screens 5–7 are judgment and must not be silently automated:**

- **A name-based brand screen produces false positives.** A company merely *containing* a brand-like token is not that brand — "Sharp Decisions" and "Kellogg Community College" both hit a regex and are both legitimate. Review hits individually; never bulk-drop on a regex.
- **Junk NAICS buckets are mixed.** Advertising/media codes (`5418`, `5121`…) hold genuine agencies *and* real SaaS products (Sendoso, NextRoll, Lob). Blanket-dropping a 4-digit code destroys good accounts. When a bucket is mixed, insert `qualified` with a reason marking it **pending review** so one delete prunes it later — a reversible choice beats a confident wrong one.
- **Expect most screens to catch little or nothing.** The Apollo query already enforced the firmographics, so a screen returning zero is a *confirmation*, not a bug. A screen returning a lot means query and qualifier disagree — investigate before trusting either.

## Field mapping

| Column | Source |
|---|---|
| `apollo_org_id` (conflict key) | `id` |
| `company` | `name` |
| `domain` | `primary_domain` |
| `linkedin_url` | `linkedin_url` |
| `revenue` / `revenue_printed` | `organization_revenue` / `_printed` |
| `naics` (text[]) | `naics_codes` |
| `parent_company` | `owned_by_organization.name` (null for qualified rows by definition — screen 1 drops the rest) |
| `growth_6m` / `12m` / `24m` | `organization_headcount_six/twelve/twenty_four_month_growth` |
| `raw_file` | provenance of the source raw row |
| `products` (jsonb) | `{"<service-key>": {"status", "reason", "matched_naics", "added"}}` |
| `added_at` | `now()` |
| `hq_location`, `employee_range` | **Not available.** See below. |

**Never map a column from a filter that isn't in the payload.** Apollo's company-search returns no location and no employee-count fields, so `hq_location` and `employee_range` cannot be honestly sourced. Leave them null with a comment saying why rather than hardcoding the query bucket — *a hardcoded value reads as real data forever after*. Populating them needs a per-org enrich call at ~1 credit each.

Insert with `on conflict (apollo_org_id) do nothing`.

## NAICS backfill

Denormalise from the static `apollo_naics` reference: `matched_naics_title`, `matched_naics_sector`, `naics_titles[]`, and the 10 hierarchy columns (sector / subsector / industry_group / naics_industry / national_industry, code + title). See `naics_reference/README.md`.

### Trap 1 — sector codes are ranges

`apollo_naics` stores sectors as **`31-33`, `44-45`, `48-49`**. So `left(code,2)` **does not join** for manufacturing, retail, or transport — it silently yields null for a large slice of a typical universe instead of erroring. (This cost 619 rows a null sector on 2026-07-17 before it was caught.)

**Read `sector_code` / `sector_title` off the matched reference row** rather than deriving the sector by prefix:

```sql
update apollo_company_universe u set
  sector_code  = coalesce(m.sector_code,  s2.naics_code),
  sector_title = coalesce(m.sector_title, s2.title)
from (select apollo_org_id, products->'<service-key>'->>'matched_naics' as mn
      from apollo_company_universe) k
left join apollo_naics m  on m.naics_code = k.mn
left join apollo_naics s2 on s2.naics_code = case left(k.mn,2)
    when '31' then '31-33' when '32' then '31-33' when '33' then '31-33'
    when '44' then '44-45' when '45' then '44-45'
    when '48' then '48-49' when '49' then '48-49'
    else left(k.mn,2) end
where u.apollo_org_id = k.apollo_org_id;
```

Deriving the *lower* levels by prefix length (3/4/5/6) is fine.

### Trap 2 — Apollo returns retired 2017 codes

E.g. Software Publishers `511210` (retired to `513210` in 2022), Furniture Stores `442110` → `449110`, plus `443142`, `446110`, `441310`, `451110`, `453910`, `448310`. These miss a 2022-only reference table and leave null leaf titles. Cosmetic — the sector still resolves — but backfill the legacy codes into `apollo_naics`, whose `naics_year=2017` flag marks exactly this case.

### Trap 3 — short codes

For a 4-digit `matched_naics`, `left(mn,5)` and `left(mn,6)` return the code itself, so the lower hierarchy levels fill with the 4-digit code rather than null. Harmless but know it's an artefact.

## Verify with reconciliation, not row counts

A bare `count(*)` looks healthy while a backfill is silently broken. Check:

```sql
select
  count(*) as qualified,
  count(*) filter (where sector_title is null)        as null_sector,
  count(*) filter (where matched_naics_title is null) as null_matched_title,
  count(*) filter (where domain is null)              as null_domain,
  count(*) filter (where revenue < <min> or revenue > <max>) as out_of_band,
  count(distinct apollo_org_id)                       as distinct_ids,
  (select count(*) from apollo_company_universe u
     where not exists (select 1 from apollo_company_raw r
                       where r.apollo_org_id = u.apollo_org_id)) as orphans
from apollo_company_universe;
```

Expect: `distinct_ids = qualified`, `orphans = 0`, `out_of_band = 0`, `null_domain = 0`. **Null-coverage per backfilled column is what exposes join bugs** — it's how Trap 1 was caught. Also sanity-check that the per-sector counts sum to the total with no null bucket.

## Report honestly

Record in `README.md`: the attrition table (rows per screen, with dispositions), real hit rates, every open judgment call, and any data-quality problem. **Never hide a flag or silently cap coverage.**

## Score columns (Stages 4/5)

Stages 4–5 write back to this table. Add columns **only if absent** — idempotent DDL, never blind `ADD COLUMN`:

```sql
ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS propensity_score numeric;
ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS propensity_scored_at timestamptz;
ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS intent_score numeric;
ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS intent_scored_at timestamptz;
```
