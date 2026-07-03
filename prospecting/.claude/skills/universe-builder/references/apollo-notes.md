# Apollo API — verified behavior (free plan, tested 2026-07)

Tool: `apollo_mixed_companies_search` (MCP).

## Filters
- `organization_naics_codes` / `not_organization_naics_codes`: work, 2–5 digits. NAICS is the entry point — no translation to Apollo industry tags needed.
- `revenue_range`: **errors on free plan** ("Cannot access advanced filters"). Errored calls cost 0 credits. Prune revenue from returned data instead.
- `organization_num_employees_ranges`: string intervals like "201,1000".
- `organization_locations`: loose — matches companies with any presence, not strictly HQ (Tel Aviv-HQ Fiverr passed a US/CA filter). Verify HQ on keepers.
- `organization_department_or_subdepartment_counts` with key `master_marketing`: queryable marketing-dept headcount (min/max) — the "meaningful marketing operation" filter.
- Layer 2 filters exist on the same endpoint: `q_organization_job_titles` + `organization_job_posted_at_range` (job postings), `organization_headcount_growth_range` + `organization_headcount_growth_past_n_months`, `latest_funding_date_range`.

## Returned fields (per organization)
- `organization_revenue` / `organization_revenue_printed`: returned even though the filter is locked. 0.0 usually means unknown, not zero revenue.
- `naics_codes` / `sic_codes`: returned but MISSING on some records (CNN, Ad Age had none). NAICS exclusion filters cannot catch code-less records — junk will slip through; prune manually.
- `owned_by_organization` (+ id): parent company when a subsidiary — use to prune subsidiaries of giants.
- `organization_headcount_six/twelve/twenty_four_month_growth`: free Layer 2 signal on every result.
- `primary_domain`, `linkedin_url`, `founded_year`, `publicly_traded_symbol`, phone.

## Costs and limits
- 1 credit per search request returning ≥1 result; 0 for errors or empty results. Confirm before every search with exactly: "This will consume 1 credit. Do you want to proceed?"
- Display cap: 50,000 records (100/page, 500 pages max).
- Ordering without a positive industry filter is popularity-ranked (well-known tech/media/staffing first) — a broad query's first page is NOT a random sample. Benchmarks: US/CA + 201–1,000 employees + standing exclusions, no positive NAICS = 48,708 companies, 0/10 relevant on page 1.

## Known data-quality issues
- Merged/confused records exist (a "Recode" record mixed Vox Media's Recode with Recode Therapeutics). Sanity-check names against domains.
- Some subsidiaries carry the parent in `owned_by_organization`, but not all parent relationships are captured.
