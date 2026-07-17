# Prospecting Methodology

A generic, service-agnostic method for building and maintaining an outbound target-account universe. Only the *inputs* to each stage change per service/client; the structure is fixed.

**This document is conceptual — what each stage does and why.** No SQL, no field names, no client values. Implementation lives in the per-stage docs; current state lives in `README.md`.

## Three pipelines, three cadences

The work splits into three independent pipelines by how often the underlying data changes:

1. **Build pipeline — one-time, batch (Stages 1–3).** Defines the ICP, pulls the raw universe, and applies any custom filters to produce the *base account set* in the `apollo_company_universe` table.
2. **Propensity pipeline — weekly (Stage 4).** A rule engine scores each account on slow-moving *fit* signals (technographics, corporate events) and writes a score back to the table.
3. **Intent pipeline — frequent, separate (Stage 5).** Fast-decaying *behavioural* signals (job postings, hiring, social) in their own higher-cadence pipeline.

Guiding principle: **separate the stable from the volatile.** Qualification is built once; slow fit signals refresh weekly; fast intent signals run on their own cadence. Never mix cadences in one pipeline.

---

## The stages

| Stage | Does | Reads → Writes | Cadence | Cost | Implementation |
|---|---|---|---|---|---|
| **1 — Requirements** | Translates the service's pain into the *inputs* for the query. No querying. | service ICP → `stage1_output.md` | one-time | free | `stage1_requirements.md` |
| **2 — Acquire** | Runs those inputs as the Apollo query; stores results verbatim. | `stage1_output.md` → `apollo_company_raw` | on refresh | credits | `stage2_acquire.md` |
| **3 — Qualify** | Applies the filters Apollo *cannot* express; produces the base account set. | `apollo_company_raw` → `apollo_company_universe` | one-time | free | `stage3_qualify.md` |
| **4 — Fit / propensity** | Scores slow, durable signals. | universe → `propensity_score` | weekly | credits | `stage4_fit.md` |
| **5 — Intent** | Scores fast, behavioural signals. | universe → `intent_score` | frequent | credits | `stage5_intent.md` |

### Build pipeline (one-time, batch)

**Stage 1 — Requirements.** Collects the inputs only: the target sectors plus the firmographic requirements (geography, headcount, revenue) and any query-native ICP filter. It hands Stage 2 an exact input set and stops there. Revisit only on a real ICP change.

**Stage 2 — Acquire.** Where the query actually happens. Runs the Stage 1 inputs as native filters and stores every returned company untouched, one row each. Raw is a **durable superset** — it keeps flagged and dropped companies too, so any qualification mistake is replayable without re-spending credits. Never edit raw to fix a downstream error.

**Stage 3 — Qualify.** Applies the judgment the query engine can't express — subsidiaries, junk, primary-business mismatch. Each company resolves to qualified / flagged / dropped with a reason; only qualified rows reach the universe. Free, so iterate freely.

> End of the build pipeline: a base account set of qualified companies in `apollo_company_universe`.

### Propensity pipeline (weekly)

**Stage 4 — Fit / propensity signals.** Durable, account-level signals: technographics (uses SAP, Adobe, a given CDP/MAP) and corporate events (acquisitions, funding). True today, almost certainly true next week. An independent rule engine turns them into a single `propensity_score`.

### Intent pipeline (separate, frequent)

**Stage 5 — Intent signals.** Fast-decaying behavioural signals of active, in-market interest: job postings, new hires, social and web activity. Its own pipeline and rule engine at a higher cadence than Stage 4 — **never run inside Stage 4** — producing an `intent_score`.

---

## Two principles that generalise

**Trust the query only where the data can prove it.** A filter constrains what gets pulled, but if the response carries no corresponding field, the stored rows hold *no evidence* it was applied — and no later query can confirm it. Know which filters are invisible in your data, verify those at the query level, and never populate a column from a filter you cannot see in the payload.

**Prefer the reversible choice on judgment calls.** Where a screen is a matter of judgment rather than a rule, mark and keep rather than silently drop. Kept rows are one delete away from gone; dropped rows are a decision nobody can review. Surface the pile and let a human decide.

---

## Naming

- **Stage 4 = fit / propensity signals** — slow, durable: technographics + corporate events → `propensity_score`.
- **Stage 5 = intent signals** — fast, behavioural: postings, hiring, social → `intent_score`.

Convention reserves "intent" for volatile behavioural signals; stable tech/event signals are "fit" or "propensity."

---

## Which file holds what

Keep the registers separate — this doc stays free of run values so it survives the next service.

| File | Register | Contains |
|---|---|---|
| `methodology.md` (this) | **Concept — timeless** | What the stages do and why. The map. |
| `stage1_requirements.md` … `stage5_intent.md` | **Implementation — per stage** | How to actually run each stage: filters, SQL, field mapping, gotchas. |
| `stage1_output.md` | **Inputs — per service** | Stage 1's deliverable: the sectors + firmographics Stage 2 runs. |
| `README.md` | **State — now** | What has actually happened: confirmed query, universe size, credits, stage done/next, open items. **The only source of truth for status.** |

A stage doc is written as work-to-do and says nothing about whether it ran — **check `README.md`.**
