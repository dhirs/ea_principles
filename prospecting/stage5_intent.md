# Stage 5 — Intent (Agent Brief)

Instructions for an agentic AI running Stage 5. Context: `methodology.md` (Stage 5). This is an **independent, frequent** pipeline (higher cadence than Stage 4). It scores each account in `apollo_company_universe` on fast-decaying **behavioural intent** signals and writes an `intent_score`. It is **not** part of Stage 4 (fit/propensity) and must run in its own pipeline.

> **Architecture:** the collect/score split, the source-neutral **adaptor** pattern, the `apollo_intent_signals` ledger, and the composite formula are defined in `adr/2026-07-18-stage5-intent-scoring.md`. The signals catalogued below are the *inputs* each adaptor collects; that ADR governs how they are normalized, stored, weighted, and combined. Note the distinction it draws: only "native buyer intent (Bombora topics)" is Apollo's own intent product — the other signals are behavioural proxies this pipeline treats as intent.

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

### Apollo native buyer intent (Bombora topics) — available on all plans

Org fields: `intent_strength`, `show_intent`, `has_intent_signal_account`, `intent_signal_account` — accounts surging on your configured topics. Buyer Intent is available on **all** Apollo plans; the plan sets only the **number of topics** you can track — Free 1, Basic 6, Professional 8, Organization 12. Activate the ranked topics from *Step 1* up to your plan's cap. **Verified 2026-07-18:** after configuring topics, `show_intent=true` and all four fields are present across sampled accounts (they were null before) — the feature is live. No surge values yet (`intent_strength=null`, `has_intent_signal_account=false`) because Apollo recomputes intent weekly, so surge populates on the next refresh. This is the `bombora_surge` adaptor's input (ADR §8, v1): read `has_intent_signal_account` (surging?), `intent_strength` (level), `intent_signal_account` (which topic); `show_intent` is the enabled gate.

#### Step 1 — Topic selection from `apollo_bombora_topics`

Before any surge lookup, map the product's seed topics to the closest **Bombora** topics that Apollo actually exposes. The full Jul-2026 taxonomy (21,632 topics) is loaded in Supabase project `thnxknvcahqktpbpqvbg`, table `public.apollo_bombora_topics` (`topic_id`, `theme`, `category`, `topic_name`, `description`; trigram index on `topic_name`). Given an input list of seed topics, select the **5** table rows that most closely match, preferring generic category topics over vendor-specific product names.

**Run — 2026-07-18.** Seed input: `Customer Data Platform`, `Marketing Automation`. Selected 5:

| # | topic_id | Theme / Category | Topic Name | Why selected |
|---|---|---|---|---|
| 1 | 1505493 | Marketing / CRM | Customer Data Platform | Exact match — seed "Customer Data Platform" |
| 2 | 1335810 | Marketing / CRM | Marketing Automation | Exact match — seed "Marketing Automation" |
| 3 | 1501018 | Marketing / Ad Tech | Marketing Automation Tools | Near-synonym of the Marketing Automation seed |
| 4 | 1342321 | Marketing / CRM | Customer Data Management | CDP-adjacent — managing the unified customer record |
| 5 | 1342516 | Marketing / CRM | Customer Data Integration | CDP-adjacent — consolidating customer data across sources |

`topic_id`s feed the Apollo surge/topic filter once buyer-intent is enabled on the plan. Vendor-specific CDPs (e.g. `SAP CDP`, `Acquia CDP`) and broader terms (`Customer Data`, `Customer Segmentation`, `Sales and Marketing Automation`) were considered but ranked below the five above for a generic category seed.

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

## Output — `apollo_company_scores`

Scores do **not** go on `apollo_company_universe`. They go in the shared scores table, one row per account per service per score type — full DDL and write contract in `stage4_fit.md` → *Output*; concept in `methodology.md` → *Where scores live*.

Stage 5 writes **only** `score_type = 'intent'` rows, upserting on `(apollo_org_id, product, score_type)`. Stage 4 owns `'fit'` and Stage 5 never touches it — that separation is why the two pipelines can run on different cadences without colliding.

- Put the decaying evidence in `signals` (which titles, how many postings, how recent) — it is what makes a score that moved explainable.
- `rules_version` is required; pass the intent rule-set version, tracked separately from Stage 4's.
- Idempotent: each run overwrites its own row, and because the date window moves, the score reflects the current window.

## Cadence & ops

- **Frequent** (e.g. weekly or faster) — higher cadence than Stage 4, its own pipeline.
- Job-postings / people lookups cost credits — batch where possible and confirm cost.
- **Verify field names and that buyer-intent is enabled on the plan** before relying on them.
- Idempotent: re-running overwrites the score and timestamp; because signals decay, each run reflects the current window.
