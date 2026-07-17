# Stage 5 — Intent (Agent Brief)

Instructions for an agentic AI running Stage 5. Context: `methodology.md` (Stage 5). This is an **independent, frequent** pipeline (higher cadence than Stage 4). It scores each account in `apollo_company_universe` on fast-decaying **behavioural intent** signals and writes an `intent_score`. It is **not** part of Stage 4 (fit/propensity) and must run in its own pipeline.

## Goal

For every account in the base set, gather fast-moving intent signals, evaluate them with a rule engine, and write a single `intent_score` (+ timestamp) back to the table.

## Input

Rows in `apollo_company_universe` (Supabase project `thnxknvcahqktpbpqvbg`) — key `apollo_org_id`, plus `domain`.

## Data source — Apollo (native intent features)

### Strong — job postings (the primary Apollo intent signal)

Use the `organizations_job_postings` endpoint (actual postings per org) and/or these search filters:

| Signal | Apollo field(s) | Meaning |
|---|---|---|
| Relevant roles open | `q_organization_job_titles` | Titles in active postings — e.g. "marketing operations", "CRM manager", "customer data analyst" |
| Hiring velocity | `organization_num_jobs_range` (`{min,max}`) | Number of active postings |
| Recency | `organization_job_posted_at_range` (`{min,max}` dates) | When roles were posted |
| Where | `organization_job_locations` | Locations of the roles |

### Plan-dependent — Apollo native buyer intent (Bombora-style topics)

Org fields: `intent_strength`, `show_intent`, `has_intent_signal_account`, `intent_signal_account`. Accounts surging on chosen topics. **Requires the intent feature enabled on the plan** — currently returns null in our data, so confirm it is active before relying on it.

### Your-own-website visitors (needs Apollo tracking script on your site)

`website_visitors_from_domains`, `website_visitors_from_past` (1/7/15/30/60/90 days), `web_page_view_counts` (`{min,max}`), `website_visitors_domain_pages` / `_exact_pages`, `website_visitors_intent` (`low`/`medium`/`high`), `show_new_companies_only`. Only surfaces companies visiting *your* tracked pages.

### New hires / leadership change — derivable, not a clean org filter

Comes from **People search**, not company search. Detect via a person's `title` + seniority + recent job-start date (Apollo also flags contacts who *recently changed jobs*). Roll the person-level hit up to the account. "New CMO < 6 months" is a people query, not a single org field.

### Headcount growth (borderline fit/intent)

`organization_headcount_growth_range` (`{min,max %}`) + `organization_headcount_growth_past_n_months`; plus point-in-time `organization_headcount_six / twelve / twenty_four_month_growth`.

## Not native — use another source

- **Social-media activity / engagement** — Apollo only stores profile URLs (`twitter_url`, `linkedin_url`, `facebook_url`), not activity. Needs a social-listening tool.
- General news / PR events.

## Worked example — job-postings query

A Stage 5 run is a job-postings search restricted to the universe's shape, over a recent time window:

```json
{
  "organization_num_employees_ranges": ["201,500", "501,1000"],
  "organization_locations": ["United States", "Canada"],
  "q_organization_job_titles": [
    "marketing operations", "marketing technology", "martech",
    "CRM manager", "customer data", "marketing automation",
    "demand generation", "lifecycle marketing", "growth marketing"
  ],
  "organization_job_posted_at_range": { "min": "<today-30d>", "max": "<today>" },
  "organization_num_jobs_range": { "min": 1 },
  "page": 1,
  "per_page": 100
}
```

**What it does:** returns the subset of the universe with active postings for these roles in the last 30 days — the accounts hiring for the pain right now. Match the returned `apollo_org_id`s to `apollo_company_universe`; those accounts get an intent bump.

**Scoring:** the rule engine reads each hit — which title, how recent, how many postings — and weights recency (a role posted 5 days ago > 80 days ago; 3 openings > 1) into `intent_score`. Because the date window moves each run, scores rise and decay week to week.

**Single-account read:** to inspect one account's postings, call `organizations_job_postings` with its `organization_id` → each posting's title, date, location, URL.

## Rule engine

- Encode intent rules as **configurable** rules. Examples: open role matching a target title in the last 30 days → +X; ≥ N active postings → +Y; new CMO/VP < 6 months (people rollup) → +Z; buyer-intent topic surging → +W.
- Because these signals decay fast, **weight recency** and let scores fall off over time (a posting from 90 days ago is weaker than one from last week).
- Combine into a single `intent_score`.

## Output

Write back to `apollo_company_universe`, keyed on `apollo_org_id`:

- `intent_score` (numeric)
- `intent_scored_at` (timestamptz)

Add columns **only if not already present** — `ALTER TABLE apollo_company_universe ADD COLUMN IF NOT EXISTS intent_score numeric;` (and the timestamp). Never blind `ADD COLUMN`.

## Cadence & ops

- **Frequent** (e.g. weekly or faster) — higher cadence than Stage 4, its own pipeline.
- Job-postings / people lookups cost credits — batch where possible and confirm cost.
- **Verify field names and that buyer-intent is enabled on the plan** before relying on them.
- Idempotent: re-running overwrites the score and timestamp; because signals decay, each run reflects the current window.
