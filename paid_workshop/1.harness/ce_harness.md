# July 2 Workshop — Use Case: The Eval Harness (Skepticism Register)

**Part 1 use case · Failure category: Customer Experience (CE)**
**Maps to:** GENOPS01-BP01 → GO1B1-01 (committed, gated eval harness / golden set)

> Same template as the grounding register. Three objections, each captured as **The concern · What
> should be fixed · If central control is dropped because the fix is hard.** Every objection argues for
> fixing the process, not abandoning the control.
>
> **Scenario recap:** a Returns Triage Agent (~2,000 returns/day) decides AUTO_APPROVE / HUMAN_REVIEW /
> REJECT from a customer's free-text reason. A release silently shipped wrong decisions — CI green,
> happy-path tests only. The architect's 50+ hand-validated forms were never committed; the harness
> left with him. Fix: commit a versioned, team-runnable golden set, wire it as a required status check.

---

## Scenario 1 — "The golden set just goes stale"

### The concern
"Those 50 forms are one architect's labels, frozen in time. The day the returns *policy* changes — new
clearance rules, a new product category, peak-season exceptions — the golden set tests yesterday's
correct behaviour. A legitimate change turns it red. So the 'fix' is to edit the golden set to match my
change — which means the test just rubber-stamps whatever I ship. Either it's stale and blocks good
changes, or it's edited to pass and protects nothing. Who keeps it *true*?"

### What should be fixed
The golden set is not a fixed-forever artefact. Stand up a **separate standard whose job is to keep it
refreshed**, backed by a real process: new and relabelled cases added on a cadence and on policy
changes, the set **versioned**, and — critically — an **independent authority** (domain / policy owner,
not the shipping dev) signs off on what "correct" now means. That stops the refresh becoming a
self-laundering step where a dev changes behaviour and adds a golden case to bless it.

Concretely, the harness is declared and the **CI gate enforces the refresh discipline** on every PR:

```yaml
# eval/harness.yaml
golden_set:
  path: eval/golden/returns_triage.jsonl
  version: 3
  min_cases: 50
  sign_off:
    authority: returns-policy-owner   # independent of the shipping dev
    approved_version: 3               # must equal version, signed by the authority
```

The gate checks:

1. **Golden set is committed and versioned** — the file exists, has ≥ `min_cases`, and is in the repo
   (not a laptop). A harness pointing at an uncommitted or empty set fails.
2. **Edits require independent sign-off** — *this is the anti-self-laundering check.* Any PR that
   touches `eval/golden/**` requires approval from `returns-policy-owner` (a CODEOWNERS rule), and
   `approved_version` must match `version`. The PR author cannot approve their own golden edits, so a
   dev can't change behaviour and bless it in the same PR.
3. **Freshness is enforced** — if the returns-policy config changes, the gate requires the golden
   `version` to be bumped and re-signed within the cadence, so the set can't silently rot against a
   policy it no longer reflects.

So a PR that edits a golden label to make a failing change pass gets a red build:

```
✗ golden-set: eval/golden/returns_triage.jsonl modified without sign-off.
  Requires approval from `returns-policy-owner`; approved_version (2) ≠ version (3).
```

### If central control is dropped because the fix is hard
Keeping a golden set true is ongoing work, so the tempting move is to skip it. Then the set lives in one
person's head and laptop again — which is *exactly the original failure*: knowledge walked out, the
harness left with the architect. With no refresh process and no independent truth, the gate is either
stale-and-blocking or edited-to-pass, and silent regressions return — now with a test rubber-stamping
them.

---

## Scenario 2 — "This is just testing 101 — why is it central?"

### The concern
"Commit your tests, run them in CI, fail on a regression — that's twenty-year-old testing hygiene,
dressed up as enterprise AI architecture with an ARB behind it. You can't write my golden cases; only
my returns team knows the right call for a damaged clearance item. The data, labels and pass bar are
irreducibly *mine*. So what is the central standard even standardising? If it's 'a harness must exist,'
that's a one-line memo, not a platform team."

### What should be fixed
Standardise the **interface, not the content.** The project owns its data, labels and pass bar entirely.
Central provides a **standardised harness shape and an SDK** that can trigger any project's harness, and
runs it as a **pre-commit hook** — guaranteeing the harness *ran on the correct data* before a change
ships. The standard isn't your tests; it's "your harness is callable, and it gets called." That's the
enforceable, fleet-wide piece a memo can't deliver.

Concretely, the **CI gate checks the contract — not your cases:**

1. **Standard entrypoint exists** — the harness exposes the central SDK signature (e.g. a
   `run_harness()` that returns per-metric results in the agreed shape). A project whose harness can't
   be invoked through the standard interface fails — that's what makes it triggerable fleet-wide.
2. **It actually ran on the committed data** — the required status check invokes the harness through
   the central runner and verifies it executed against the committed golden set with a non-zero case
   count. A stubbed, skipped, or empty run fails — closing the "we have tests" checkbox nobody verifies.
3. **Results are produced and gating** — the harness emits per-metric results the gate can read and
   block on. No results, or results not wired to the status check, fails.

So the central standard asserts *callable + called + ran on the committed data* — uniform across every
project, which is exactly what a memo can't enforce:

```
✗ harness-contract: run_harness() executed against 0 cases (expected ≥ 50 from eval/golden/).
  Harness must run on the committed golden set, not a stub.
```

### If central control is dropped because the fix is hard
Without a central interface and hook, "we have tests" becomes a checkbox nobody verifies. Each project
decides whether and when to run; the team rewarded on shipping skips the harness under deadline; a
non-regression-tested change slips to production — the silent regression, again — and there's no
fleet-wide guarantee any other agent in the group is any safer. A policy memo with no execution behind
it is exactly the goodwill-dependence the standard exists to remove.

---

## Scenario 3 — "A slow, metered gate on every commit"

### The concern
"Production-realistic *and* adversarial cases replayed on every PR isn't a unit suite — it's a model
eval. Each case is a real inference call. My CI goes from three minutes to twenty-plus, burning tokens
on every push. Across every project in the group, the central harness isn't protecting spend — it's
*generating* it, and it's killing my inner loop. It'll be the gate developers resent most, and it gets
marked non-blocking the first tight sprint."

### What should be fixed
Tier coverage by stage rather than running everything everywhere. A **fast smoke subset** of the golden
set runs at **pre-commit / PR** so the inner loop stays tight; the **full production-realistic +
adversarial replay** runs **nightly or on the release branch**, where twenty minutes and the token bill
don't matter. The cost/coverage tradeoff is decided explicitly and owned. The ARB's "we accept the cost"
only lands *after* the cost has been minimised this way — absorbing un-minimised cost is what gets the
gate disabled.

Concretely, the tiering is **declared and the CI gate enforces it** so it can't be quietly bypassed:

```yaml
# eval/harness.yaml (continued)
stages:
  pre_commit:
    suite: eval/golden/smoke.jsonl   # fast subset, time-bounded
    max_runtime_seconds: 180
  nightly:
    suite: eval/golden/full.jsonl    # full production-realistic + adversarial replay
    required_on: release             # required status check on the release branch
```

The gate checks:

1. **Smoke subset exists and is bounded** — `pre_commit.suite` is present, non-empty, and the run stays
   under `max_runtime_seconds`, so the inner loop can't balloon into a 20-minute model eval on every push.
2. **Full replay is a required check where it belongs** — the nightly/release stage is wired as a
   required status check on the release branch; a release can't merge without it having run green.
3. **Disabling needs an owned record** — marking the full eval non-blocking requires a linked
   cost-acceptance sign-off, not a silent `continue-on-error`. The gate fails a release that drops the
   full replay without that record — so the tradeoff is decided by an owner, not dodged under deadline.

```
✗ harness-stages: release branch missing required nightly full-eval, and no cost-acceptance
  record linked. Tier the suite or file an owned exception — do not silently disable.
```

### If central control is dropped because the fix is hard
To dodge the friction, teams quietly thin the harness to nothing or disable it — and the gate dies of
friction rather than because central control was wrong. You're back to happy-path-only CI and production
regressions found by customers and Finance. Dropping the gate to save minutes per commit reopens the
exact failure it was built to stop; the cost of one bad refund surge dwarfs the CI time.

---

## The reframe (say this in the room)
Each objection is legitimate, and each argues for **fixing the implementation, not abandoning the
intent.** Stale → refresh process + independent truth. "Just testing" → standardise the interface, not
the data. Too slow → tier pre-commit vs nightly. Drop the control because the fix is hard and the silent
regression returns — the same failure one level up: no owner, no enforcement, invisible until it's
expensive.

## Facilitator notes
- 10 min/scenario: set the scene (2) → drop the objection, let the room argue (5) → converge on the fix
  (2) → land the cost of dropping control (1).
- Prompts: Who signs off that a refreshed golden case is *correct*? What's standardised — your data or
  the interface? What runs at pre-commit vs nightly, and who owns that tradeoff?
