# apollo_naics — NAICS reference table

Supabase table `public.apollo_naics` (project `thnxknvcahqktpbpqvbg`). Lets you read the text category for any company by joining on its NAICS code, without storing category text on the company rows.

## Coverage
- **2,129 rows.** Full official **2022 NAICS**: 20 sectors, 96 subsectors, 308 industry groups, 689 industries, 1,012 national industries.
- Plus **4 legacy 2017 codes** Apollo still returns (`333249`, `333911`, `333999`, `454110`), tagged `naics_year='2017'`.
- Every one of the distinct codes on `apollo_company_universe` rows resolves (0 unresolved).
- Titles verified byte-for-byte against the source (MD5 `da4bfb495711d43d5bea50acb4cb8f9f`).

## Columns
- `naics_code` (PK) — code as text; sectors use ranges `31-33`, `44-45`, `48-49`.
- `level` — 2 (sector) to 6 (national industry).
- `title` — official category name.
- `definition` — full official NAICS definition. **Currently NULL** (see below).
- `parent_code` — code one level up.
- `sector_code`, `sector_title` — owning sector (range-aware).
- `naics_year` — `2022`, or `2017` for the 4 legacy codes.

## Reading a company's category
```sql
select c.company,
       n.title  as category,
       n.sector_title
from apollo_company_universe c
join apollo_naics n
  on n.naics_code = (c.products->'cdp-selection'->>'matched_naics');
```
To expand every code on a company (arrays hold multiple):
```sql
select c.company, code, n.title
from apollo_company_universe c
cross join lateral unnest(c.naics) as code
join apollo_naics n on n.naics_code = code;
```

## definition column — not yet populated
Titles came from a verified 2022 package. The full official **definition** paragraphs live in the Census file `2022_NAICS_Descriptions.xlsx`, which isn't reachable from this environment (allowlist blocks census.gov and raw GitHub). To backfill: drop that .xlsx into `prospecting/` and I'll load definitions locally in one pass — no network needed. Titles + hierarchy already cover "read the category per company"; definitions are additive.

## Load artifacts (this folder)
- `body_1..4.sql` — code/title/year batches (hierarchy derived in SQL on insert).
- `gen2.py` / `gen3.py` — generators (source: `naics` PyPI package, 2022).
