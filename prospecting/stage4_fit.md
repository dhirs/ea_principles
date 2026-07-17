# Stage 4 — Fit / Propensity (Agent Brief)

Instructions for an agentic AI running Stage 4. Context: `methodology.md` (Stage 4). This is an **independent, weekly** pipeline. It scores each account in `apollo_company_universe` on slow-moving **fit** signals and writes a `fit` score to `apollo_company_scores`. It does **not** touch the build pipeline (Stages 1–3), and it does **not** handle behavioural intent (that is Stage 5, a separate pipeline).

## Goal

For every account in the base set, gather durable fit signals from Apollo enrichment, evaluate them with a rule engine, and write a single `fit` score — plus the signals behind it — to `apollo_company_scores`.

> **The universe carries none of these signals.** Verified 2026-07-17: Apollo's company-search response (all 3,816 raw rows) has no `current_technologies`, no funding fields, and no `departmental_head_count` — search is a thin discovery endpoint. Every fit signal except headcount growth requires a fresh `organizations_enrich` call at ~1 credit per account. Budget the run before starting.

## Input

Rows in `apollo_company_universe` (Supabase project `thnxknvcahqktpbpqvbg`) — key `apollo_org_id`, plus `domain`.

## Data source — Apollo Organization Enrichment

Use `organizations_enrich` (single) or `organizations_bulk_enrich` (batch — prefer this to cut credits). It returns the full company record. Read these **fit** fields:

| Fit signal | Apollo field(s) | Meaning |
|---|---|---|
| **Technographics** | ⚠️ **NOT in enrichment on this plan** — see *CRITICAL* below. Read technology from the **search** endpoint's `currently_using_any_of_technology_uids` filter instead. | Tools the company uses — the core Area 1 signal, but recovered by search probes, not enrichment. |
| **Funding** | `total_funding`, `total_funding_printed`, `latest_funding_round_date`, `latest_funding_stage`, `funding_events[]` | Capital available to spend. |
| **Department headcount** | `departmental_head_count` (marketing, IT, sales, eng, …) | A real function of the right size exists. |
| **Headcount growth** | `organization_headcount_six / twelve / twenty_four_month_growth` | Scaling. Slow-moving; sits on the fit/intent boundary. |
| **Public status / size** | `publicly_traded_symbol`, `publicly_traded_exchange`, `market_cap`, `organization_revenue`, employee count, `founded_year` | Scale and maturity. |
| **Classification** | `naics_codes`, `sic_codes`, `industry`, `keywords`, `industries` / `secondary_industries` | Business descriptors. |
| **Ownership** | `owned_by_organization` (parent) | Reflects a *completed* acquisition **of** the company. |

### Not reliable in Apollo — use a second source

- **Acquisitions made *by* the company** (acquirer M&A events, "Company X acquired Y"). Apollo tracks who owns whom, not timestamped acquirer events. Pull from Crunchbase, a news/events API, or similar.
- Rich corporate-event / news feeds generally.

### Do NOT use here — these are Stage 5 (intent), a separate pipeline

- Job postings (`organization_job_postings`, titles, counts, dates)
- Apollo native buyer-intent topics (`intent_strength`, `has_intent_signal_account`)
- Website-visitor intent

## Method — Area 1 technology match

Area 1 asks: *does this account run a technology the ICP cares about?* Match on the technology **name / uid — never on `category`.** Apollo has no "Customer Data Platform" category and scatters CDPs across eight incoherent buckets (Segment sits in *Data Management Platform*, mParticle in *Other*, Lytics in *Analytics and Tracking*, and the product literally named "Salesforce Customer Data Platform (CDP)" in *Customer Relationship Management*). Full evidence and rationale: ADR `adr/2026-07-17-stage4-technology-category.md`. Reference data: `supported_technologies.csv` — Apollo's supported-technologies export, the authoritative `name → category` map (10,514 technologies across 80 categories).

The target list is **not hardcoded here.** It is produced by the four-step method below from an ICP-supplied input, so a new client or a changed requirement re-runs the method instead of editing this file.

**1 — Take the ICP's technology list.** The ICP-definition stage supplies `relevant_technologies`: the technologies that count as fit for this product. Entries may be specific products (`Adobe Marketo Engage`, `Segment`) or a grouping the owner wants covered (`any CDP`, `any MAP`). For `cdp-selection` (owner: Dheeraj) the requirement is *any CDP **or** any MAP*.

**2 — Match the list against `supported_technologies.csv`.** For each entry, resolve against the CSV's `Technology` column (exact, case-insensitive, trimmed) to: (a) canonicalise to Apollo's exact string; (b) validate it exists — an entry absent from the CSV silently matches nothing, so flag it, don't ship it; (c) pull every alias (`Segment` **and** `Twilio Segment`; `Tealium Customer Data Hub`). A grouping the CSV expresses as a **category** (e.g. Marketing Automation) expands to that category's members — using the CSV's category column as a *build-time enumeration source* is fine, and is not the same as scoring a record's category field. A grouping with **no coherent category** (CDP — none exists) is enumerated as specific products, each validated against the CSV.

**3 — Emit `TARGET_TECHNOLOGIES` — the list to filter on.** The deduped set of exact Apollo names (plus uids) that survived step 2. This is versioned *data*, not code; regenerate it when the input list or the CSV changes. The current `cdp-selection` output is `stage4_target_technologies.json` (33 CDP + 466 MAP names, every string validated verbatim against the CSV).

**4 — Discover → attribute → score (search-only path).** Area 1 is scored **entirely from the search endpoint**, not from enrichment. See the critical finding below — enrichment returns no technographics on this plan, so it cannot score technology at all. Discover the matching companies with one OR query, then recover *which* CDP each runs with one search per uid, then score the count. Full runbook below.

## CRITICAL — enrichment carries no technographics on this plan (verified 2026-07-17)

The earlier version of this runbook assumed `organizations_enrich` returns `technology_names[]` and scored Area 1 from it. **It does not.** Verified against 10 live enrichment records on the current plan: the payload has **no `technology_names`, no `current_technologies`, no tech field of any kind.** It *does* carry `estimated_num_employees`, `departmental_head_count`, funding, address, `short_description` — durable firmographics for areas 2/3, but nothing for Area 1.

Consequence — **the two endpoints do different jobs, and only search knows technology:**

| | Search (`mixed_companies_search`) | Enrichment (`organizations_enrich`) |
|---|---|---|
| Filters on technology? | **Yes** — `currently_using_any_of_technology_uids`, server-side | no such filter |
| Returns technology in payload? | no (thin row) | **no** (verified — not just thin, absent) |
| So how do we read technology? | **the filter itself** — a company in the result *ran that uid* | cannot |
| Cost | 1 credit / page (100 rows) | ~1 credit / company |

Because **only the search filter can prove a technology**, Area 1 detection is done by **running the search once per target uid** and recording who comes back. Enrichment is demoted to a *separate, optional* areas-2/3 source, not part of scoring.

## Execution — discover → attribute → score (Claude Code runbook)

### Step 1 — Discover: who runs ANY target CDP

One search, Stage 2 firmographics AND the 33 CDP uids as an OR filter. A **fresh** query against all of Apollo (the stored universe rows are thin and can't be filtered by technology). Confirm cost first (`per_page: 1` probe → `total_entries`), then paginate.

```json
{
  "organization_naics_codes": ["11","21","22","23","31","32","33","44","45","48","49","51","52","53","54","56","61","62","71","72"],
  "organization_locations": ["United States", "Canada"],
  "organization_num_employees_ranges": ["201,500", "501,1000"],
  "revenue_range": { "min": 50000000, "max": 100000000 },
  "organization_department_or_subdepartment_counts": { "master_marketing": { "min": 5, "max": 20 } },
  "currently_using_any_of_technology_uids": [ ...cdp.uids_confident from stage4_target_technologies.json (33)... ],
  "per_page": 100
}
```

Save each page to `apollo_companies/<date>-cdp/page-N.json` + `breadcrumbs.json` (Stage 2 discipline). This yields the discovered id set (how many companies run *at least one* CDP). Cost: 1 credit/page.

### Step 2 — Intersect with the universe

The discover query hits all of Apollo, so it surfaces companies Stage 3 already rejected (subsidiaries, agencies) and brand-new ones. **Keep only ids present in `apollo_company_universe`** — `apollo_company_scores` has an FK to it, and those are the only Stage-3-qualified accounts. The dropped ids stay recorded in the page captures; they are not scored.

### Step 3 — Attribute: WHICH CDP each runs (one search per uid)

The OR query tells you a company runs *some* CDP; it does not say which. To score a **count**, run the search **once per uid** (`currently_using_any_of_technology_uids: ["<one uid>"]`, same firmographics, `per_page: 100`) and record the returned ids. Invert to `{org_id: [uids…]}`. Runner: `stage4_uid_probe.py` (reads `APOLLO_API_KEY` from `.env`, writes `uid_probes/<uid>.json`).

- **Cost: 1 credit per uid that returns ≥1 match, 0 for a uid with no matches.** For 33 CDP uids where ~13 have any presence in this ICP, ≈13 credits.
- A uid that returns 0 across the whole universe is either genuinely unused here or a dead slug — log it, don't silently treat 0 as "not applicable."
- The per-uid ids must reconcile: `|union of all uid hits|` must equal the OR query's `total_entries`. (2026-07-17: 13 live uids covered exactly 216 — matched.)

### Step 4 — Score

`score = number of distinct target CDPs the company runs` (Area 1 = |matched uids|). Every discovered company scores ≥1 by construction; the count ranks them (Segment + Lytics = 2 outranks Segment alone = 1). Write to `apollo_company_scores`:

```
(apollo_org_id, product='cdp-selection', score_type='fit',
 score = |matched|,
 signals = {"matched_uids":[…], "matched_names":[…], "method":"search_probe"},
 rules_version = 'area1-v1')
```

Runner: `stage4_score.py`. **Gotcha:** `cdp.uids_confident` and `cdp.names` in the JSON are **not** positionally aligned — never `zip()` them. Map uid→name via the file's `_uid_rule` (display name lowercased, spaces→underscores; the one hyphen exception, `adobe_realtime_cdp`, is overridden explicitly). Scoreless is the rule for the rest of the universe — a company Apollo reports running no CDP gets **no row**, not a 0 (we never enriched it, so we have no positive evidence to store).

### Step 5 — (optional) Bank enrichment for areas 2/3

Enrichment buys nothing for Area 1, but its firmographics feed later areas. If enriching, bank each full record into `apollo_company_raw` — `enriched_payload` (verbatim), `last_enriched = now()`, `enrichment_query =` the discover filter — leaving the Stage 2 `payload` untouched. Runner: `stage4_bank_enrichment.py`. Two rules learned 2026-07-17:

- **UPDATE, never upsert.** These ids already exist in raw; a merge-duplicates upsert takes the insert path when no conflict fires and trips the `NOT NULL payload` constraint. PATCH by `apollo_org_id`.
- **Watch domain drift.** Enrichment can resolve a requested domain to a *different* entity with a *different* id (`ag.state.mn.us` → "Minnesota Dept of Health", `state.mn.us`). That id is not in our swept set — skip it, don't insert an orphan.

### The columns — `apollo_company_raw` (enrichment)

Stage 2 writes the thin search row into `payload`; this stage optionally writes the full enrichment into a **separate** column. Added 2026-07-17 (DDL in `stage2_acquire.md`):

- `enriched_payload jsonb` — full `organizations_enrich` record, verbatim. Null until enriched. **No technographics on this plan** — firmographics only.
- `last_enriched timestamptz` — when enrichment last ran.
- `enrichment_query jsonb` — the discover filter that surfaced this org; per-row provenance, like Stage 2 `breadcrumbs`.

### Record

Discover/intersect/probe counts, credits spent, and any skips in `README.md`.

## Worked example — attribute & score one account (Area 1)

A company surfaces in the discover query (runs *some* CDP) and is in the universe. To score it:

1. **Attribute from the per-uid probes.** Its `apollo_org_id` appears in `segment.json` and `lytics.json` → `matched_uids = ["lytics", "segment"]`. (No enrichment call — technology is only visible via the search filter.)
2. **Score = count.** `score = 2`.
3. **Write:** insert into `apollo_company_scores` as `(apollo_org_id=X, product='cdp-selection', score_type='fit', score=2, signals={"matched_uids":["lytics","segment"], "matched_names":["Lytics","Segment"], "method":"search_probe"}, rules_version='area1-v1')`.

Durable signal: next weekly run re-probes; because a company's CDP stack moves slowly, the score usually holds — unlike Stage 5's fast-decaying intent.

## Rule engine

**Area 1 (current, `area1-v1`):** `score = |matched target CDPs|` — a plain count, from the search probes. No weighting yet; the count itself ranks (2 CDPs > 1). Range is small (1–5 observed).

**Future areas (2–5, per `adr/2026-07-17-stage4-fit-areas.md`):** when funding / department headcount / customer-data-estate signals join, encode them as **configurable, versioned** rules and combine into one `fit` score on an explicit, documented scale (the table allows 0–100). Bump `rules_version` whenever the combination changes — that is what lets a moved score be read as "the account changed" vs "we changed the rules." Those signals come from enrichment (funding, `departmental_head_count`) and non-Apollo sources, **not** from Area 1's search probes.

## Output — `apollo_company_scores`

Scores do **not** go on `apollo_company_universe`. They go in their own table, one row per account per service per score type. Concept and rationale: `methodology.md` → *Where scores live*. The table exists (created 2026-07-17):

```sql
create table if not exists apollo_company_scores (
  id            bigint generated always as identity primary key,
  apollo_org_id text not null references apollo_company_universe(apollo_org_id) on delete cascade,
  product       text not null,                        -- service namespace, e.g. 'cdp-selection' (same key as universe.products)
  score_type    text not null,                        -- 'fit' (Stage 4) | 'intent' (Stage 5)
  score         numeric not null check (score between 0 and 100),
  signals       jsonb  not null default '{}'::jsonb,  -- the enrichment values the rules fired on
  rules_version text   not null,                      -- which rule set produced this score
  scored_at     timestamptz not null default now(),
  unique (apollo_org_id, product, score_type)
);
```

Stage 4 writes **only** `score_type = 'fit'` rows. Stage 5 owns `'intent'`. Neither ever updates the other's rows — that is the point of the row-per-score shape.

**Write contract:**

- Upsert on `(apollo_org_id, product, score_type)` — the weekly run overwrites its own row, so re-running is idempotent and never duplicates.
- Over PostgREST, that means `on_conflict=apollo_org_id,product,score_type` **with `Prefer: resolution=merge-duplicates`** — *not* the `ignore-duplicates` used for leads elsewhere in this repo. Overwriting is the whole point here; ignore-duplicates would silently keep last week's score forever.
- `rules_version` is `not null` with no default — the writer must pass it. Deliberate: it stops an unattributable score getting in, and it is what distinguishes "the account changed" from "we changed the rules" when a score moves.
- Populate `signals` with what the rules actually read (e.g. `{"cdp": "segment", "total_funding": 42000000}`). A score without its signals can't be reviewed.
- The FK cascades — an account dropped from the universe takes its scores with it.
- `score` is constrained to **0–100**; keep the rule engine on that scale or change the check deliberately.

Verified on creation: upsert overwrites rather than duplicates, `fit` and `intent` rows coexist on one account, the FK rejects an unknown org, and the check rejects a score of 150.

**Downstream: `apollo_company_technology` (the CRM's Apollo Technologies filter).**
The CRM Companies page filters by technology via a **view** —
`apollo_company_technology` — that unnests `signals->matched_uids` / `matched_names`
(aligned by array index) from **these `score_type='fit'` rows**. It is a `create view`,
not a table, so **there is no separate step to run**: the instant this stage writes a
score row, the view reflects it. Nothing in Stage 4 writes the view. Two contract points
keep it correct — honour them whenever you probe a *new* technology set (e.g. MAP, not
just CDP):
- The technology-bearing score **must** carry `signals.matched_uids` **and**
  `matched_names` as **positionally-aligned** arrays (a `zip` mislabel is exactly the bug
  caught on the CDP run — Segment scored as "Lytics"). uid = the slugified display name.
- It must be a `score_type='fit'` row. A future non-`fit` tech score, or a combined score
  that drops the raw `matched_uids`, would **not** surface in the view — widen the view
  definition deliberately if that happens (its filter is `score_type='fit'`, its columns
  come straight from the two arrays). View DDL lives in `hubspot/ui/crm.md`.
- The CRM caches the view for 300s (`revalidateTag('technologies')` to bust) — a fresh
  Stage 4 run shows up in the UI within ~5 min, or immediately on that revalidate.

## Cadence & ops

- **Weekly.** Independent pipeline — not tied to the build pipeline or to Stage 5.
- Area 1 costs credits at the **search** endpoint: 1 discover probe + N discover pages + one search per live uid. Confirm the discover count before probing per-uid. Enrichment (areas 2/3) is a separate, optional spend.
- **Verify field availability against the live API on the current plan before relying on it** — this is exactly how the "enrichment has no technographics" finding surfaced. Don't assume a documented field is populated.
- Idempotent: re-running overwrites each account's `fit` row.
