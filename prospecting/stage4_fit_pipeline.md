# Stage 4 — Fit / Propensity Pipeline (Agent Brief)

Instructions for an agentic AI running Stage 4. Context: `methodology.md` (Stage 4). This is an **independent, weekly** pipeline. It scores each account in `apollo_company_universe` on slow-moving **fit** signals and writes a `propensity_score`. It does **not** touch the build pipeline (Stages 1–3), and it does **not** handle behavioural intent (that is Stage 5, a separate pipeline).

## Goal

For every account in the base set, gather durable fit signals from Apollo enrichment, evaluate them with a rule engine, and write a single `propensity_score` (+ timestamp) back to the table.

## Input

Rows in `apollo_company_universe` (Supabase project `thnxknvcahqktpbpqvbg`) — key `apollo_org_id`, plus `domain`.

## Data source — Apollo Organization Enrichment

Use `organizations_enrich` (single) or `organizations_bulk_enrich` (batch — prefer this to cut credits). It returns the full company record. Read these **fit** fields:

| Fit signal | Apollo field(s) | Meaning |
|---|---|---|
| **Technographics** | `current_technologies[]` (`{uid, name, category}`), `technology_names[]` | Tools the company uses — SAP, Adobe, Segment, a CDP/MAP. The core fit signal. |
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

## Sample — target tech stack (MAP + CDP)

The fit signal we care about most: the account already runs a **marketing-automation platform (MAP)** or **customer data platform (CDP)**. Target UIDs (verify exact spellings against Apollo's technology list):

- **CDP:** `segment`, `mparticle`, `tealium`, `rudderstack`, `hightouch`, `census`, `amperity`, `treasure_data`, `lytics`, `blueconic`, `bloomreach`
- **MAP / marketing automation:** `salesforce`, `pardot`, `hubspot`, `marketo`, `eloqua`, `brevo` (also try `sendinblue` — Brevo's former name, likely Apollo's actual UID), `activecampaign`, `klaviyo`, `mailchimp`, `braze`, `iterable`, `customer_io`

Sample Apollo search query — matches accounts using ANY of these (OR):

```json
{
  "currently_using_any_of_technology_uids": [
    "segment", "mparticle", "tealium", "rudderstack", "hightouch",
    "amperity", "bloomreach",
    "salesforce", "pardot", "hubspot", "marketo", "eloqua",
    "brevo", "sendinblue", "activecampaign", "klaviyo", "mailchimp", "braze", "iterable"
  ]
}
```

From enrichment instead of search: read `current_technologies[]` and score a hit when any entry's `uid` is in the list above, or its `category` is a marketing-automation / CDP category.

## Worked example — enrich & score one account

Given an account in `apollo_company_universe` (`apollo_org_id` X, domain `example.com`):

1. **Enrich:** call `organizations_enrich` with the domain/id. Read the fit fields:

```json
{
  "current_technologies": [
    { "uid": "segment", "name": "Segment", "category": "Customer Data Platform" },
    { "uid": "salesforce", "name": "Salesforce", "category": "CRM" }
  ],
  "total_funding": 42000000,
  "latest_funding_stage": "Series B",
  "departmental_head_count": { "marketing": 12, "information_technology": 30 },
  "organization_headcount_twelve_month_growth": 0.18
}
```

2. **Apply rules** (illustrative): uses a CDP (`segment`) → +40; `total_funding` ≥ $25M → +20; marketing team 5–20 → +15; 12-mo growth > 15% → +10.
3. **Score:** `propensity_score = 85` → write `propensity_score` + `propensity_scored_at` to the row.

Next weekly run re-enriches; because these signals are durable, the score usually holds steady — unlike Stage 5's fast-decaying intent.

## Rule engine

- Encode fit rules as **configurable, versioned** rules — they change slowly. Examples: uses a CDP/MAP → +X; `total_funding` > $Y → +Z; marketing team ≥ N → +W; recent acquisition (external source) → +V.
- Combine the rule outputs into a single `propensity_score`.
- Keep the scoring scale explicit and documented (e.g. 0–100).

## Output

Write back to `apollo_company_universe`, keyed on `apollo_org_id`:

- `propensity_score` (numeric)
- `propensity_scored_at` (timestamptz)

Add the columns **only if not already present** — `ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS propensity_score numeric;` (and the timestamp). Never blind `ADD COLUMN`.

## Cadence & ops

- **Weekly.** Independent pipeline — not tied to the build pipeline or to Stage 5.
- Enrichment costs credits — use bulk enrichment and confirm cost before large runs.
- **Verify exact enrichment field names against the live API on the current plan** — the schema above is the expected shape, but confirm before relying on it.
- Idempotent: re-running overwrites the score and timestamp for each account.
