---
name: universe-builder
description: Build a Layer 1 firmographic account universe from a product/service description. Use whenever the user wants to find target companies, build a prospect/account list, identify which industries to sell into, translate an ICP into NAICS codes, or run an Apollo company search — even if they only describe their product and ask "who should I sell to". Two parts, always in order: (1) judge the top 10 best-fit industries as NAICS codes and let the user select; (2) run a confirmed Apollo search on the selection, prune, and deliver an account spreadsheet. Also trigger for "universe build", "Layer 1", "account list", "ICP to filters", or "which industries".
---

# Universe Builder — Layer 1

Turn a product/service description into a pruned, named-account spreadsheet. Two parts, strictly in order. Never collapse them: Part 1 is judgment (free), Part 2 spends Apollo credits and must not run until the user has confirmed both the industry selection and the credit cost.

## Part 1 — Service to industries (no searching, no credits)

1. If the user hasn't described their product/service, ask. If the description leaves these unclear, ask (one round of questions, max):
   - Who buys it (role/department)?
   - What pain does it solve?
   - Verticals already sold into, or explicitly out of scope?
   - Geography and company-size band (defaults: US + Canada, 201–1,000 employees)
2. Reason from the pain, not from generic industry lists: which industries feel this pain hardest and have budget to fix it? Think about channel structure, data intensity, regulatory pressure, buying maturity — whatever the specific pain implies.
3. Present the **top 10 industries** as a selectable list. Each entry: NAICS code (3–4 digit), industry name, one line of why. Rank by fit, best first. Use an interactive widget with checkboxes if available; otherwise a numbered markdown table and ask which numbers to include.
4. Always include the standing exclusions (see below) and say they'll be applied.
5. Part 1 ends when the user confirms a selection. Do not search before that.

## Part 2 — Search, prune, deliver

### Build the query
- `organization_naics_codes`: the selected codes
- `organization_locations`: user's geography (default ["United States", "Canada"])
- `organization_num_employees_ranges`: default ["201,1000"] unless user changed it
- `not_organization_naics_codes`: ["813", "51", "61", "92"] (nonprofits/associations, media, education, public admin) plus any user-specific exclusions
- Do NOT use `revenue_range` — it is locked on free plans and errors. Revenue is pruned from returned data instead.

### Confirm the filter set — always
Before the first search, show the user the complete filter set as a table — every filter, its value, and whether it came from the user or is a default (mark defaults clearly, e.g. "201–1,000 employees (default — change?)"). Defaults the user never saw are not consent. The user must approve this table before any credit is spent. If they change anything, show the revised table.

### Credit discipline
- Each search returning ≥1 result costs 1 credit; errors and zero-result searches cost 0.
- Before ANY search, confirm with the exact words: "This will consume 1 credit. Do you want to proceed?" For batches, state the total count and total credits upfront.
- If a query errors or needs modification, STOP and show the user the revised filter set. A changed query is a new query — never re-run a modified version on a prior approval.

### Test page first
Run one page (per_page 25). Report honestly:
- Total match count (`pagination.total_entries`)
- Hit rate on the page against the full ICP (expect 10–15%; report the real number even if it's 0)
- Which fields came back populated (revenue, NAICS, owner)

If hit rate is poor, diagnose (wrong codes? missing NAICS records? popularity-ranked junk?), propose a filter change, and get approval before the next credit. Only page through once the user agrees the quality justifies it.

### Prune rules (applied to returned data, after search)
Read `references/apollo-notes.md` for field-level behavior before pruning. Drop or flag:
- Revenue outside the user's band (default $50–100M; `organization_revenue` — 0.0 usually means unknown: flag, don't silently drop)
- Subsidiaries: `owned_by_organization` present → flag with parent name
- Missing NAICS: exclusions can't catch these; check the company manually before keeping
- Wrong geography: HQ location is loose (foreign HQs with US offices pass the filter) — verify on keepers
- Obvious junk: staffing agencies, media, associations that slipped through

### Deliver & store — three sinks, then denormalize
The audit trail and the target list are NOT the same artifact. Keep everything locally; put only clean rows in the database.

1. **Raw JSON (local, EVERYTHING):** every organization Apollo returned, all fields verbatim, append-only, at `apollo_companies/<date>/page-N.json`. Never filtered.
2. **CSV (local, EVERYTHING):** every company — qualified AND flagged AND dropped — each with `status` and `reason` columns, at `apollo_companies/<date>/universe_all_<date>.csv`. The human-review artifact. Columns: company, domain, employee count, revenue, NAICS, HQ location, parent (if any), 6/12/24-month headcount growth, Apollo org id, status, reason, date added.
3. **Supabase `apollo_company_universe` (QUALIFIED ONLY):** insert ONLY rows whose status is `qualified` (in-band revenue, independent, right geography, NAICS confirmed). NEVER insert dropped or flagged rows — the DB is the clean target list, not the audit trail. Set `raw_file` to the source page and `products.<product>` to `{"status":"qualified","reason":"...","matched_naics":"...","added":"<date>"}`. Upsert on `apollo_org_id` with ON CONFLICT DO NOTHING.

**After every insert, denormalize NAICS category text onto the new rows** — NAICS codes never change, so store the text on the row and skip the join at read time. From reference table `apollo_naics` (full 2022 NAICS + the legacy 2017 codes Apollo still returns), set on each newly inserted company:
- `matched_naics_title` and `matched_naics_sector` — join `apollo_naics` on `products->'<product>'->>'matched_naics'`;
- `naics_titles` (text[]) — aligned to `naics[]` via `unnest(naics) WITH ORDINALITY` + `array_agg(title ORDER BY ord)`.
- **NAICS hierarchy of the matched code (10 cols):** decompose `matched_naics` into its 5 levels and store code+title for each — `sector_code`/`sector_title`, `subsector_code`/`subsector_title`, `industry_group_code`/`industry_group_title`, `naics_industry_code`/`naics_industry_title`, `national_industry_code`/`national_industry_title`. Derive each level code by prefix length (sector = range-aware first 2 digits: 31-33, 44-45, 48-49; subsector = first 3; industry group = first 4; NAICS industry = first 5; national industry = first 6, NULL when the matched code is only 5 digits) and LEFT JOIN `apollo_naics` per level for the title.
If `apollo_naics` does not exist yet, build/refresh it first (see `naics_reference/README.md`), then denormalize. This step is not optional — a row is not "done" until its category text is populated.

Report: searched N pages, X raw, Y qualified (→ DB), Z flagged/dropped (→ CSV only), hit rate, what was dropped and why. Real numbers, never summaries of what you "would" do.

## Standing exclusions

813 (nonprofits, trade associations, religious/civic), 51 (media/publishing — keep 513 software publishers only if the user's ICP includes SaaS), 61 (education), 92 (public administration). Also always prune: subsidiaries of giants, staffing/recruiting firms unless the ICP says otherwise.

## References

- `references/apollo-notes.md` — verified Apollo API behavior (plan limits, field quirks, credit costs). Read before building any query.
