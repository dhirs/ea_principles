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
| **4 — Fit / propensity** | Scores slow, durable signals. | universe → scores register (`fit`) | weekly | credits | `stage4_fit.md` |
| **5 — Intent** | Scores fast, behavioural signals. | universe → scores register (`intent`) | frequent | credits | `stage5_intent.md` |

### Build pipeline (one-time, batch)

**Stage 1 — Requirements.** Collects the inputs only: the target sectors plus the firmographic requirements (geography, headcount, revenue) and any query-native ICP filter. It hands Stage 2 an exact input set and stops there. Revisit only on a real ICP change.

**Stage 2 — Acquire.** Where the query actually happens. Runs the Stage 1 inputs as native filters and stores every returned company untouched, one row each. Raw is a **durable superset** — it keeps flagged and dropped companies too, so any qualification mistake is replayable without re-spending credits. Never edit raw to fix a downstream error.

**Stage 3 — Qualify.** Applies the judgment the query engine can't express — subsidiaries, junk, primary-business mismatch. Each company resolves to qualified / flagged / dropped with a reason; only qualified rows reach the universe. Free, so iterate freely.

> End of the build pipeline: a base account set of qualified companies in `apollo_company_universe`.

### Propensity pipeline (weekly)

**Stage 4 — Fit / propensity signals.** Durable, account-level signals: technographics (the tools an account runs — whatever the ICP cares about) and corporate events (acquisitions, funding). True today, almost certainly true next week. An independent rule engine turns them into a single `propensity_score`.

A durable-signal source has two faces, and they don't carry the same data. The cheap *search* face filters accounts server-side on an attribute; the paid *lookup* face returns a fuller record per account. Which face holds which signal is a per-source, per-plan fact you must verify, not assume — an attribute you can filter on is not guaranteed to appear in the looked-up record. So the first Stage 4 question for any signal is *which face can prove it*: score a filterable-but-not-returned attribute by the filter itself (measure by membership, one query per value), and spend the paid lookup on the durable fields it genuinely returns. The implementation doc names, per source, which signal lives on which face.

### Intent pipeline (separate, frequent)

**Stage 5 — Intent signals.** Fast-decaying behavioural signals of active, in-market interest: job postings, new hires, social and web activity. Its own pipeline and rule engine at a higher cadence than Stage 4 — **never run inside Stage 4** — producing an `intent_score`.

#### Intent adaptors — one folder, one shape

Stage 5 combines many signals (Apollo intent surge, job postings, event attendance, …). **Each signal is a self-contained adaptor, never inline in the pipeline, and every adaptor has the same shape** so a new signal is a new folder plus a registry line — nothing else. The convention every adaptor follows:

- **Folder:** `intent_adaptors/<adaptor_slug>/` — one per adaptor (e.g. `apollo_bombora`, `apollo_job_postings`, `event_attendance`).
- **`README.md`:** how it works — source, inputs, fields read, output row, config keys, status. Written to the same section structure as `intent_adaptors/apollo_bombora/README.md`, the reference.
- **`adaptor.py`:** a class implementing the shared `SignalAdaptor` contract (`collect(accounts, window) -> list[SignalRecord]`), registered in the central adaptor registry. It emits normalized rows into the `apollo_intent_signals` ledger and **never** writes the scores register.
- **Same contract regardless of source.** Apollo or not, an adaptor emits the identical `SignalRecord` shape (`value_norm` 0–1, `observed_at`, `confidence`, `evidence`). Source-specific work stays inside the adaptor; everything downstream is source-blind.

The shared contract and the composite scorer are specified in `adr/2026-07-18-stage5-intent-scoring.md`; each adaptor's specifics live in its own `README.md`.

### Where scores live — a separate register, one row per score

Scores do **not** live on the account. They live in their own register, keyed by **account + service + score type**, one row per score. The universe table stays a description of the company; the scores register holds our opinions about it. Three reasons, each a consequence of something above:

**A score is per service, not per account.** The same company is a strong fit for one service and irrelevant to the next — a score is only meaningful once you say *what for*. This mirrors the qualify verdict, which is already namespaced per service on the account row. Key the score the same way, or the second service overwrites the first's answer.

**The pipelines are independent, so their writes must be too.** Stages 4 and 5 run on different cadences by design. Given a column each on a shared row, they become two writers on one row; given a row each, neither can touch the other's work. A new score type is then a new row, not a schema change — the register absorbs the next signal without a migration, the same way the stage docs absorb the next service.

**A bare number is a decision nobody can review.** Store the signals the rules fired on and the rule-set version beside every score. Without the signals, a score cannot be audited — only trusted. Without the version, a score that moves between runs is ambiguous: the account changed, or we changed. This is *prefer the reversible choice* applied to scoring — a score that can be explained can be argued with; one that can't is just a number.

Scores are **current-state**: each run overwrites its own row. The register answers "what do we think now," not "what did we think in March."

---

## Principles that generalise

**Trust the query only where the data can prove it.** A filter constrains what gets pulled, but if the response carries no corresponding field, the stored rows hold *no evidence* it was applied — and no later query can confirm it. Know which filters are invisible in your data, verify those at the query level, and never populate a column from a filter you cannot see in the payload.

**A signal you can filter on but can't read back is measured by the filter itself.** Some sources let you *filter* on an attribute server-side yet omit it from the returned record — and the richer, paid lookup may not carry it either. Don't conclude the signal is unavailable. Run the filter once per value of interest; membership in each result is the observation, and the union reconstructs the per-account attribute the payload withheld. This holds for any filterable attribute — the tools an account runs, a certification, a segment tag — whatever the service happens to expose as a filter but not a field. Verify the reconstruction: the per-value counts must sum to the "any value" query's total. This is the constructive twin of the principle above — there, an invisible filter can't be trusted as a *stored fact*; here, the filter is trustworthy precisely as a *measurement*, because being in the result is proof the attribute holds.

**Prefer the reversible choice on judgment calls.** Where a screen is a matter of judgment rather than a rule, mark and keep rather than silently drop. Kept rows are one delete away from gone; dropped rows are a decision nobody can review. Surface the pile and let a human decide.

**Enrich once; cache the whole payload, not the answer.** When a paid lookup *does* return the attribute, it returns a superset — every value the account carries, not just the one you asked about. Bank the full record, and the next question about that account is free; score-and-discard turns one paid lookup into a fresh charge every time the question changes. Corollary: filter with the cheap call (find *who* to look up), spend the expensive call only on the survivors, and never re-spend it on an account already in the cache. **But confirm the attribute is actually in the payload before building on it** — a documented field can come back empty on a given plan, at which point the measurement falls to the filter (principle above) and the paid lookup earns its keep only on the *other*, durable fields it does return.

**A vendor taxonomy is only a scoring signal where it is coherent.** A provider's own category labels can be too incoherent to score on — a concept may have no category, or be smeared across many, or share a bucket with unrelated tools. When that happens, match the *named* entities you care about (sourced from the provider's authoritative list so the strings are exact and refreshable), not the category. Test the taxonomy before you build a rule on it.

---

## Naming

- **Stage 4 = fit / propensity signals** — slow, durable: technographics + corporate events → a `fit` score.
- **Stage 5 = intent signals** — fast, behavioural: postings, hiring, social → an `intent` score.

Convention reserves "intent" for volatile behavioural signals; stable tech/event signals are "fit" or "propensity."

---

## Which file holds what

Keep the registers separate — this doc stays free of run values so it survives the next service.

| File | Register | Contains |
|---|---|---|
| `methodology.md` (this) | **Concept — timeless** | What the stages do and why. The map. |
| `stage1_requirements.md` … `stage5_intent.md` | **Implementation — per stage** | How to actually run each stage: filters, SQL, field mapping, gotchas. |
| `intent_adaptors/<name>/README.md` + `adaptor.py` | **Implementation — per signal** | One Stage-5 intent adaptor: how it collects a single signal, and the code that does it. Same folder shape for every adaptor — `apollo_bombora` is the reference. |
| `stage1_output.md` | **Inputs — per service** | Stage 1's deliverable: the sectors + firmographics Stage 2 runs. |
| `adr/<date>-<topic>.md` | **Decisions — dated** | Why a choice was made, on the day it was made: one record per decision, status Proposed/Accepted. Survives the rule change it justified — a stage doc tells you what to type, an ADR tells you why. |
| `README.md` | **State — now** | What has actually happened: confirmed query, universe size, credits, stage done/next, open items. **The only source of truth for status.** |

A stage doc is written as work-to-do and says nothing about whether it ran — **check `README.md`.**
