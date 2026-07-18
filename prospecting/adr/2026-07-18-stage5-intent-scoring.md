# ADR — Stage 5 intent: adaptor-based signal collection and composite scoring

- **Status:** Accepted
- **Date:** 2026-07-18
- **Scope:** The *architecture* of Stage 5 — how signals of any origin are collected, normalized, stored, and combined into one `intent_score`. Not the final weight values, not the field-level Apollo query detail (that stays in `stage5_intent.md`).
- **Service:** CDP-selection. The signal set and weights are service-specific; the adaptor/scorer machinery is not.
- **Context:** `methodology.md` (Stage 5). Implementation brief: `stage5_intent.md`. Scores contract: `stage4_fit.md` → *Output*. Stage 4 counterpart to the "Apollo is one source among several" stance: `2026-07-17-stage4-fit-areas.md`.

## Problem

`stage5_intent.md` had become a catalogue of signals — job postings, native buyer-intent topics, website visitors, leadership change, headcount growth — with no model tying them into a score, and no account of how new signals get added over time. Two failures were baked in:

1. **Vendor schema deciding what intent means.** Just like Stage 4, the signal list was drifting toward "what Apollo exposes." Real intent signals live outside Apollo — event attendance (already in our own DB: `maven_attendance`), social buzz, news/PR — and a field-first approach silently drops them.
2. **No seam for growth.** A weekly pipeline that scores intent must be able to gain a new signal without a rewrite, without destabilising existing scores, and without re-tuning forcing a re-fetch of paid data.

Stage 5 also differs from Stage 4 in kind: its signals **decay**, so the model is not "is this fact true" but "how strong and how recent is this behaviour, right now."

## Decision

### 1. Adaptors, not a monolith. Apollo is one source among many.

Each signal is produced by a **source-neutral adaptor** that answers exactly one question about an account, in a shared vocabulary: *how strong is signal X, 0–1, as of when, with this evidence.* The adaptor owns everything source-specific — the Apollo call, a social API, a news feed, a SQL query against our own tables. It knows nothing about weights, decay, or the composite.

### 2. Collect and score are separate stages.

Signal **collection** (costs credits / API calls) is decoupled from **scoring** (free math). Collection writes raw, timestamped, normalized evidence to a shared **signal ledger**; scoring reads the ledger and computes the number. Consequences: re-weighting never re-burns credits, scores are reproducible, and back-testing a weight change is a pure re-score.

### 3. The standard write target is the ledger — not `apollo_company_scores`.

Adaptors **never** write a composite score. If they did, each would invent its own 0–100 scale, the scales would not be comparable, and re-weighting would mean re-running every adaptor. Instead every adaptor emits the same row into `apollo_intent_signals`:

```
apollo_intent_signals
  apollo_org_id    text         -- account key (join to apollo_company_universe)
  signal_type      text         -- 'apollo_job_postings' | 'bombora_surge' | 'event_attendance' ...
  source           text         -- 'apollo' | 'bombora' | 'internal_db' | 'social_tool' | 'news'
  value_raw        numeric      -- native magnitude (3 postings, 12 mentions) — audit only
  value_norm       numeric      -- 0..1 semantic strength (the adaptor's job)
  confidence       numeric      -- 0..1 coverage/reliability of this observation
  observed_at      timestamptz  -- when the behaviour happened → drives decay
  evidence         jsonb        -- explainable detail (which titles, which event, urls)
  adaptor_version  text
  collected_at     timestamptz
  run_id           text
  primary key (apollo_org_id, signal_type)   -- upsert, keep latest per type
```

Only the **composite scorer** writes `apollo_company_scores` (`score_type = 'intent'`).

### 4. The adaptor contract and registry.

```python
class SignalAdaptor(Protocol):
    signal_type: str          # stable id, e.g. 'apollo_job_postings'
    source: str
    enabled: bool             # shadow-mode toggle (collect at weight 0)
    def collect(self, accounts, window) -> list[SignalRecord]:
        ...                   # source-specific fetch/compute -> normalized records
        # guarantees: value_norm in [0,1]; observed_at set; evidence populated
```

Adaptors are held in a **registry** (a list of instances). The weekly runner is source-agnostic:

```
for a in registry if a.enabled:
    ledger.upsert(a.collect(accounts, window))
score()   # reads ledger, writes apollo_company_scores
```

Adding *any* new signal — Apollo or not — is: write one class, register it, ship it `enabled` at weight 0. It collects into the ledger in **shadow mode**; watch its `value_norm` distribution for a few weeks; then give it a real weight in config. Nothing else moves.

### 5. Division of labour (the boundary that makes this hold).

- **Adaptor owns `value_norm`** — the mapping from a native magnitude to a 0–1 semantic strength, *with saturation* so no single signal can run away (`1 − e^(−n/k)` or a log). Only the adaptor understands what "3 postings" means.
- **Scorer owns weight, half-life, aggregation** — all cross-source policy. It computes recency decay at scoring time from `observed_at`, so the ledger stays a factual record and the score stays re-computable without re-collecting.

### 6. Composite formula (v1 — linear and explainable).

For an account, take the latest ledger row per enabled `signal_type` within the lookback window:

```
decay_i        = 0.5 ** (age_days_i / half_life_i)        # age from observed_at
contribution_i = weight_i * value_norm_i * decay_i
intent_score   = round( 100 * Σ contribution_i / Σ weight_i )   # Σ over all ENABLED types
```

- Dividing by the **total enabled weight** (not just present signals) means **absence lowers the score** — an account with one fresh signal and four silent ones is cooler than one lighting up on several. Intent is corroboration, not a single loud event. (Alternative — divide by present-signal weight — recorded under *Considered and not chosen*.)
- `value_norm` arrives already saturated (adaptor's job), so the composite needs no per-signal magnitude handling.
- `confidence` is stored per signal but **not** folded into the number in v1 — kept explicit and simple; folding it in is an open item.
- Everything tunable — weights, half-lives, saturation `k`, lookback — lives in a versioned config keyed by `rules_version`; per-signal contributions are written into the score row's `signals` jsonb so any score is explainable after the fact.

### 7. Output — one composite row, contributions inside it.

The scorer writes a single `score_type = 'intent'` row per account (upsert on `(apollo_org_id, product, score_type)`, per `stage4_fit.md`). It does **not** emit per-signal sub-rows into `apollo_company_scores`; per-signal facts live in `apollo_intent_signals`, and per-signal *contributions* live in the score row's `signals` jsonb. One place to read the number, one place to read the evidence.

### 8. Signal roadmap — availability × strength, added incrementally.

| Phase | Signal | `signal_type` | Source | Status |
|---|---|---|---|---|
| v1 | Bombora topic surge (the 5 ICP topics from Step 1) | `bombora_surge` | bombora via apollo | build now — Apollo's own intent signal; topics configured, `show_intent=true` verified 2026-07-18 (surge values arrive on Apollo's weekly refresh) |
| v1 | Job postings for target roles | `apollo_job_postings` | apollo | build now — corroborating signal, on current plan |
| v1 | Event attendance rollup | `event_attendance` | internal_db (`maven_attendance`) | build now — first **non-Apollo** proof of the seam |
| v2 | New leadership / role change | `leadership_change` | apollo (People rollup) | next |
| v3 | Website visitors (own site) | `web_visitors` | apollo (tracking script) | when the script is deployed |
| backlog | Social buzz / engagement | `social_buzz` | social-listening tool | later |
| backlog | News / PR (funding, M&A) | `news_events` | news API | overlaps Stage 4 trigger — dedupe first |

Starting weight priors (config, to be calibrated): `bombora_surge` > `web_visitors` > `apollo_job_postings` > `leadership_change` ≈ `event_attendance` > `social_buzz`. Not-yet-available signals (`web_visitors`, `social_buzz`, `news_events`) sit at weight 0. v1 is `bombora_surge` + `apollo_job_postings` + `event_attendance`, decayed — `bombora_surge` contributes once Apollo's weekly refresh populates surge values (the field surface is already live).

**Buyer Intent availability (correction, 2026-07-18).** An earlier draft assumed Apollo buyer intent was gated to higher plan tiers — that was wrong. Buyer Intent ships on **all** plans; the plan caps only the **number of topics** (Free 1 / Basic 6 / Professional 8 / Organization 12). Activate the *Step 1* ranked topics up to the cap. Verified on a sample of universe accounts: after configuring topics, `show_intent=true` and all four intent fields are present (previously null); no surge yet, consistent with Apollo's weekly recompute. `bombora_surge` reads `has_intent_signal_account` (surging?), `intent_strength` (level), `intent_signal_account` (which topic), gated by `show_intent` — which is why it moved from v4 to v1 above.

## Consequences

- **The scorer is closed to source.** Adding a non-Apollo signal changes zero scorer lines and zero schema — only a new adaptor and a weight. That is the whole point.
- **`event_attendance` proves it on day one.** A SQL adaptor over `maven_attendance` emits the same row as the Apollo one; the scorer cannot tell them apart. If the pattern only ever carried Apollo signals we would not know it was source-neutral.
- **Re-tuning is free and safe.** Weights and half-lives change in config under a new `rules_version`; a re-score reads the existing ledger. No credits spent, old scores reproducible.
- **Absence is meaningful.** Because the denominator is total enabled weight, coverage matters — a signal that fails to collect for an account is not neutral, it is cold. Collection failures must therefore be distinguishable from genuine zero (write nothing vs write `value_norm = 0`); adaptors write a row only on a real observation.
- **Weights are still open.** Nothing here fixes a number. The priors are a starting point to be regressed against downstream outcomes (responses, meetings) once that data exists.
- **Headcount growth is out of Stage 5.** It is trajectory/fit and already lives in Stage 4; scoring it here double-counts one fact across two scores. Held, not adopted.

## Considered and not chosen

- **Adaptors writing composite scores directly.** Rejected — incomparable per-adaptor scales, and re-weighting forces a re-fetch. The ledger + single scorer is the fix.
- **Per-signal sub-rows in `apollo_company_scores`** (e.g. `score_type = 'intent.job_postings'`). Rejected for now — it splinters the scores table and duplicates the ledger. Per-signal visibility comes from `apollo_intent_signals` and the `signals` jsonb. Revisit only if downstream consumers need per-source scores as first-class rows.
- **Divide by present-signal weight** (score reflects only what fired). Rejected as the default — it lets a single fresh signal read as maximal intent and hides thin coverage. Kept as an option if corroboration proves too punishing in practice.
- **ML / learned scoring.** Premature — no labelled outcome data yet. Start linear and explainable; instrument now, learn weights later.
- **Folding `confidence` into the score in v1.** Deferred — keep the number simple and legible first; add a coverage/confidence multiplier once the base model is trusted.
