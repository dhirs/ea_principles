# Reference Implementation — GO1B1-01

**Principle:** Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository.

This document tells a project team *how to actually build* what GO1B1-01 mandates. The principle is the rule; this is the buildable spec.

---

## What you're building

An `eval/` folder in your workload repo containing:

- Labelled test scenarios (one file per scenario)
- Supporting data and mocks
- An adapter that lets the harness runner invoke your agent
- A runner config
- A CI workflow that runs the harness on every PR and blocks merge on failure

When done, any PR touching `src/agent/` re-runs every scenario in `eval/scenarios/`. If any scenario fails, the PR cannot merge.

---

## Directory layout

```
your-workload-repo/
  src/agent/                   ← the agent code being gated
  eval/
    scenarios/                 ← one file per labelled test case
      R-001-clean-return.json
      R-002-final-sale-rejection.json
      R-003-ambiguous-gift.json
      ...
    data/                      ← supporting data / mocks
      mock-orders.json
      mock-policy-rules.json
    adapter.py                 ← project-specific glue to your agent runtime
    config.yaml                ← runner config (adapter path, environment, timeouts)
    README.md                  ← link back to this reference implementation
  .github/workflows/
    eval.yml                   ← the CI workflow (sample below)
```

---

## Scenario file schema

One JSON file per scenario in `eval/scenarios/`. Required shape:

```json
{
  "scenario_id": "R-001-clean-return",
  "description": "Standard return, item not on final-sale list, customer in good standing.",
  "tags": ["happy_path", "auto_approve"],
  "input": {
    "form": {
      "order_id": "ORD-87412",
      "item_sku": "SHRT-RED-L",
      "reason_text": "Didn't fit properly, ordered the wrong size."
    },
    "customer_context": {
      "customer_id": "C_445812",
      "tenure_months": 18,
      "prior_returns_90d": 0
    }
  },
  "expected_decision": {
    "action": "AUTO_APPROVE",
    "acceptable_alternatives": []
  },
  "expected_evidence_trace": {
    "must_consult": [
      "customer_context.prior_returns_90d",
      "input.form.item_sku",
      "policy.final_sale_list"
    ],
    "must_apply_rules": [
      "final_sale_check_passed",
      "tenure_threshold_met"
    ],
    "must_not_invoke": ["human_review_escalation"]
  }
}
```

Fields:

- `scenario_id` — stable identifier, used in failure messages and diffs.
- `tags` — freeform classification (happy path, edge case, adversarial, fairness pair, etc.).
- `input` — the exact payload the agent receives. Must be self-contained — no external lookups required at run time other than the data committed under `eval/data/`.
- `expected_decision.action` — the canonical correct decision.
- `expected_decision.acceptable_alternatives` — other decisions that are also defensible (so the harness doesn't fail on minor variation). Empty array if the decision is binary.
- `expected_evidence_trace.must_consult` — list of input fields and data references the agent's reasoning trace *must* show it considered.
- `expected_evidence_trace.must_apply_rules` — named rules the trace must show were applied.
- `expected_evidence_trace.must_not_invoke` — actions the agent must not take in this scenario.

---

## Adapter contract

The runner doesn't know how to invoke your agent. You write a small adapter that translates the harness's interface into a call against your runtime.

Required signature (Python example):

```python
# eval/adapter.py
def run_scenario(input_payload: dict) -> dict:
    """
    Given a scenario's `input` field, invoke the agent and return:
    {
        "decision": {"action": "AUTO_APPROVE", ...},
        "evidence_trace": ["consulted: customer_context.prior_returns_90d", ...],
        "raw_output": {...}   # for debugging
    }
    """
    # Your code here — call your agent however it runs.
    # Examples:
    #   in-process:  from src.agent.main import handle; return handle(input_payload)
    #   Lambda:      boto3.client('lambda').invoke(...)
    #   StepFn:      boto3.client('stepfunctions').start_execution(...); poll; return
    ...
```

Two flavours are typical:

- **In-process adapter** — fast, runs in CI without cloud, calls agent code directly. Used for every PR.
- **End-to-end adapter** — slow, invokes the deployed Step Function / Lambda in a staging environment. Scheduled (nightly), not per-PR.

`config.yaml` picks which adapter to use:

```yaml
adapter: eval.adapter:run_scenario
environment: in_process
timeout_seconds: 30
```

---

## Grading

The runner compares `run_scenario`'s output against the scenario's expected fields:

1. **Decision match.** `decision.action` must equal `expected_decision.action`, or be in `expected_decision.acceptable_alternatives`.
2. **Evidence trace.** Every entry in `must_consult` and `must_apply_rules` must appear in the agent's `evidence_trace`. Every entry in `must_not_invoke` must not appear.
3. **Hard failures** — adapter raises, timeout exceeded, output schema invalid.

Trace grading defaults to substring match. For complex reasoning traces, swap in an LLM-as-judge grader (out of scope here, see GO1B1-03 for metrics encapsulation).

---

## CI workflow

Sample GitHub Actions (`.github/workflows/eval.yml`):

```yaml
name: Eval Harness
on:
  pull_request:
    paths:
      - 'src/agent/**'
      - 'eval/**'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install eval-core   # the shared platform library
      - run: eval-core run --config eval/config.yaml
      - run: eval-core diff --base ${{ github.event.pull_request.base.sha }}
```

**Critical step — make it a required status check.** In your repo settings → Branches → Branch protection rules → add `Eval Harness / eval` as a required status check on `main` (or `develop`). Without this, the gate is advisory and a developer can merge red. GO1B1-01 v1.1.0 explicitly excludes advisory CI runs.

---

## Bootstrap — day 1

You don't author 50 scenarios before you can merge anything. Start with 5–10:

1. The 3 most common happy-path cases.
2. The 2–3 most common rejection cases.
3. 1–2 edge cases the original architect knows about.

Tag them all `tags: ["bootstrap"]`. Open an issue to expand to 30+ in the first month. Every customer-reported regression after launch gets pinned as a new scenario before the patch ships.

---

## PII handling for scenarios derived from production

Production-derived scenarios are gold for realism but a liability for PII. Rules:

- Replace customer IDs, order IDs, addresses, names with synthetic equivalents (use a deterministic hash so cross-references still hold within the scenario).
- Strip free-text fields of anything that could identify a person. Keep semantic content.
- Never commit scenarios containing payment data, full addresses, or DOB.
- Run scenarios through your org's standard PII scrubber before committing.

`eval/data/` should never contain real customer records.

---

## Scenario authorship and review

- Any developer can add a scenario in a PR.
- New scenarios require one reviewer (any team member).
- Modifying an `expected_decision` on an existing scenario requires two reviewers, one of whom must be the agent's lead developer or architect.
- Scenarios derived from a customer complaint should link back to the ticket in the `description` field.

---

## Where to extend

GO1B1-01 only mandates the harness exists, is structured, and gates merges. Related siblings handle:

- **GO1B1-02** — stratification (declare strata, minimum per stratum).
- **GO1B1-03** — metrics encapsulation.
- **GO1B1-04** — drift monitoring against the baseline.
- **GO1B1-05** — refresh cadence.

For Responsible AI work specifically, see the RAI scenario guidance in the central platform docs (paired fairness scenarios, adversarial inventory, controllability edge cases). Those guidelines apply to *what* you put in `eval/scenarios/`; this reference implementation only covers *the structure*.

---

## Minimum acceptance for the principle to be "satisfied"

- `eval/scenarios/` exists with ≥10 scenario files conforming to the schema.
- `eval/adapter.py` (or equivalent) exists and is invoked by `eval/config.yaml`.
- `.github/workflows/eval.yml` (or equivalent) exists and runs `eval-core run` on every PR touching `src/agent/**`.
- The CI job is configured as a **required** status check on the integration branch via branch protection.

Show this checklist green and the project architect can self-attest GO1B1-01 with mechanical evidence.
