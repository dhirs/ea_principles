# Prospecting Methodology

A generic, service-agnostic method for building and maintaining an outbound target-account universe. Only the *inputs* to each stage change per service/client; the structure is fixed.

## Three pipelines, three cadences

The work splits into three independent pipelines by how often the underlying data changes:

1. **Build pipeline — one-time, batch (Stages 1–3).** Defines the ICP, pulls the raw universe, and applies any custom filters to produce the *base account set* in the `apollo_company_universe` table.
2. **Propensity pipeline — weekly (Stage 4).** A rule engine scores each account on slow-moving *fit* signals (technographics, corporate events) and writes a score back to the table.
3. **Intent pipeline — frequent, separate (Stage 5).** Fast-decaying *behavioural* signals (job postings, hiring, social) in their own higher-cadence pipeline.

Guiding principle: **separate the stable from the volatile.** Qualification is built once; slow fit signals refresh weekly; fast intent signals run on their own cadence. Never mix cadences in one pipeline.

---

## Build pipeline (one-time, batch)

### Stage 1 — Requirements (collect the inputs)

Stage 1 does **no querying**. Its whole job is to translate the service's pain into the *inputs* for the Apollo query, then hand them to Stage 2 — where the query actually runs.

- **Output:** `stage1_output.md` — the full input set for Stage 2:
  - the target NAICS sectors, and
  - the firmographic requirements: geography, headcount, revenue, and any Apollo-native ICP filter (e.g. marketing-department size).
- **Hands off to:** Stage 2, which runs this exact input set as the Apollo query.
- **Cadence:** one-time per service; revisit only on a real ICP change.

### Stage 2 — Acquire (raw → `apollo_company_raw`)

Take the Stage 1 inputs, run them as the Apollo query, and store the raw results untouched, one row per company. **This is where the query happens** — Stage 1 only collected the inputs.

- **Input — the Stage 1 output** (`stage1_output.md`), applied as Apollo-native filters in two parts:
  - *Part 1 — base firmographics:* target sectors, geography, headcount, revenue.
  - *Part 2 — native ICP filters:* e.g. marketing-department headcount. (Technology is **not** here — it moved to Stage 4.)
- **Process:** paginate the full result set; confirm credit cost before spending.
- **Output:** one row per company upserted into the Supabase table **`apollo_company_raw`** — `id`, `apollo_org_id`, `payload` (jsonb = full Apollo record, verbatim), `last_refresh` (timestamptz). Upsert on `apollo_org_id`; every run refreshes `payload` + `last_refresh`.
- **Cadence:** on demand / on refresh (idempotent upsert). Costs credits.

### Stage 3 — Custom filters (optional, manual SQL)

Apply filters the client wants that Apollo's query *cannot* express.

- **Input:** the raw records in `apollo_company_raw`.
- **Process:** custom, usually **manual SQL manipulation** — subsidiary-of-giant / junk / primary-business judgment, plus any client-specific carve-outs.
- **Output:** the **base account set** — the clean records in `apollo_company_universe`.
- **Cadence:** one-time, optional. Free.

> End of the build pipeline: a base account set of qualified companies in `apollo_company_universe`.

---

## Propensity pipeline (weekly)

### Stage 4 — Fit / propensity signals

Enrich each account with slow-moving, account-level *fit* signals and score it.

- **Signals:** technographics (uses SAP, Adobe, a given CDP/MAP) and durable corporate events (acquisitions, funding). These change slowly — true today, almost certainly true next week.
- **Process:** an independent **rule engine** evaluates the signals and produces a single score.
- **Output:** a **`propensity_score`** (fit score) written to `apollo_company_universe`, at the account level.
- **Cadence:** weekly. Independent pipeline.

---

## Intent pipeline (separate, frequent)

### Stage 5 — Intent signals

Fast-decaying *behavioural* signals that indicate active, in-market buying interest.

- **Signals:** job postings, new hires, social-media activity, web activity — things that can change week to week.
- **Process:** its own pipeline and rule engine, at a higher cadence than Stage 4. **Not** run inside Stage 4.
- **Output:** an **`intent_score`** at the account level.
- **Cadence:** frequent, separate pipeline.

---

## Naming

- **Stage 4 = fit / propensity signals** — slow, durable: technographics + corporate events → `propensity_score`.
- **Stage 5 = intent signals** — fast, behavioural: postings, hiring, social → `intent_score`.

Convention reserves "intent" for volatile behavioural signals; stable tech/event signals are "fit" or "propensity."
