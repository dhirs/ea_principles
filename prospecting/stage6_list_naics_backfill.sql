-- Stage 6 (list variant) — NAICS backfill for list-sourced apollo_company_universe rows.
--
-- Mirrors stage3_qualify.md's backfill, but scoped to rows tagged
-- products ? 'martech-uk-list' (list-sourced companies), so it never touches ICP rows.
-- Idempotent + re-runnable: recomputes the denormalised columns from apollo_naics every
-- time. matched_naics comes from products->'martech-uk-list'->>'matched_naics' (first NAICS
-- code present — the list variant keeps ALL companies, so it is NOT screened to ICP sectors).
--
-- Trap 1 (sector ranges 31-33/44-45/48-49): sector is read off the matched apollo_naics
--   row (m.sector_code/sector_title), NOT derived by left(code,2). A range-mapped fallback
--   (s2) covers the rare case where the matched leaf code is absent (Trap 2).
-- Trap 2 (retired 2017 codes absent from the 2022 ref): leaves null leaf titles — cosmetic;
--   the sector still resolves via the fallback. Not fabricated.
-- Trap 3 (short matched_naics): left(mn,5)/left(mn,6) return the code itself — harmless.
--
-- Apply via Supabase execute_sql / apply_migration (project thnxknvcahqktpbpqvbg) or
--   psql "$SUPABASE_DB_URL" -f stage6_list_naics_backfill.sql.

with tgt as (
  select apollo_org_id,
         products->'martech-uk-list'->>'matched_naics' as mn,
         naics
  from apollo_company_universe
  where products ? 'martech-uk-list'
),
resolved as (
  select
    t.apollo_org_id,
    t.mn,
    -- matched leaf (may be null for a retired/absent code — Trap 2)
    m.title       as matched_title,
    -- sector: prefer the matched row's own (range-aware) sector; else range-map the 2-digit
    coalesce(m.sector_code,  s2.naics_code) as sector_code,
    coalesce(m.sector_title, s2.title)      as sector_title,
    sub.naics_code as subsector_code,   sub.title as subsector_title,
    ig.naics_code  as industry_group_code, ig.title as industry_group_title,
    ind.naics_code as naics_industry_code,  ind.title as naics_industry_title,
    nat.naics_code as national_industry_code, nat.title as national_industry_title,
    -- titles for EVERY code on the company, in array order
    (select array_agg(n.title order by u.ord)
       from unnest(t.naics) with ordinality as u(code, ord)
       join apollo_naics n on n.naics_code = u.code) as naics_titles
  from tgt t
  left join apollo_naics m   on m.naics_code = t.mn
  left join apollo_naics s2  on s2.naics_code = case left(t.mn,2)
        when '31' then '31-33' when '32' then '31-33' when '33' then '31-33'
        when '44' then '44-45' when '45' then '44-45'
        when '48' then '48-49' when '49' then '48-49'
        else left(t.mn,2) end
  left join apollo_naics sub on sub.naics_code = left(t.mn,3)
  left join apollo_naics ig  on ig.naics_code  = left(t.mn,4)
  left join apollo_naics ind on ind.naics_code = left(t.mn,5)
  left join apollo_naics nat on nat.naics_code = t.mn
)
update apollo_company_universe u set
  matched_naics_title    = r.matched_title,
  matched_naics_sector   = r.sector_title,
  sector_code            = r.sector_code,
  sector_title           = r.sector_title,
  subsector_code         = r.subsector_code,
  subsector_title        = r.subsector_title,
  industry_group_code    = r.industry_group_code,
  industry_group_title   = r.industry_group_title,
  naics_industry_code    = r.naics_industry_code,
  naics_industry_title   = r.naics_industry_title,
  national_industry_code = r.national_industry_code,
  national_industry_title= r.national_industry_title,
  naics_titles           = r.naics_titles
from resolved r
where u.apollo_org_id = r.apollo_org_id;
