# Reference Implementation — GR3B1-01

## 1. principle_id
GR3B1-01 — Recover gracefully when a model call goes wrong. Every model call sits behind a recovery contract: each call site declares the `output_schema` the next step requires, a `retry` policy (which failures are retryable + backoff), and a `fallback` for when retries are exhausted. The model is called only through a central wrapper that validates the response, retries retryable failures with backoff, and returns the declared fallback on exhaustion (retried side-effecting calls are idempotent). Two pre-merge lints enforce declaration completeness and routed execution; recovery efficacy is watched via emitted telemetry and a quarterly review. First Reliability standard; opens the GENREL pillar. (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — a broken/unrecovered model call is a reliability failure, not an inherent regulatory exposure.
- D2 (repeatability_cost): 3 — a central LLM SDK call wrapper (schema validator, backoff/retry engine, idempotency-key plumbing, fallback executor, routed-execution AST lint, telemetry hooks). Weeks of platform engineering per project if rebuilt locally; this is the tier rubric's own "Centralised LLM SDK" calibration example.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints plus the quarterly recovery-effectiveness review are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `llm-sdk` call path — `call_model(...)` validates the response against the declared `output_schema`, retries retryable failures (timeout, rate-limit, parse-failure) with backoff, and returns the declared `fallback` on exhaustion. Passes an idempotency key for side-effecting retries.
- Recovery-spec schema at `llm-schema/recovery.v1.yaml` — per call site `output_schema`, `retry` (retryable classes + backoff policy), `fallback` (default value / degraded response / route-to-human).
- Routed-execution AST lint plugin (the GO3B1-01 no-inline pattern, applied to the call plane) + declaration-completeness lint; CI workflow templates.
- Telemetry hooks — emits parse-failure, retry, and fallback-trigger rates through GO3B2-01's channel, tagged by call site and workload.
- Default retry/backoff policy + circuit-breaker primitive for repeated downstream failure.
- SDK version floor at `llm-schema/sdk_floor.txt`.

**Operates**
- Semver on the LLM SDK; maintains the default retry/backoff and circuit-breaker behaviour.
- Maintains the recovery-effectiveness dashboard and the fallback-rate threshold; runs/coordinates the quarterly review.
- Publishes baseline guidance on what counts as a usable `output_schema` and a safe `fallback`.

**Owns paths**
- `<platform-repo>/llm-sdk/` — the call wrapper, retry engine, fallback executor.
- `<platform-repo>/llm-schema/` — recovery schema, sdk_floor, CHANGELOG.
- `<platform-repo>/llm-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `prompts/<name>/recovery.yaml` (or registered-template metadata) — per call site: `output_schema`, `retry`, `fallback`.
- pins the LLM SDK version (≥ floor).
- `.github/workflows/recovery-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the two pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Call sites — invoke every model call through `call_model(...)`; never call the provider SDK inline.
- The `output_schema` for each call — the actual shape the next step consumes (only the project knows the refund decision needs `{action, amount}`).
- The `fallback` for each call — what is safe for *this* workflow when the model can't deliver (a default, a degraded answer, route-to-human / escalate).
- Idempotency keys / handlers for any call that triggers a side effect.

**Consumes via**
- `pip install llm-sdk` (or language equivalent).
- GitHub Actions: `uses: <org>/llm-workflows/.github/workflows/recovery-check.yml@v1`.
- Quarterly efficacy review: the workload's emitted fallback-rate telemetry against the declared threshold.

---

## 5. interface_contract

**Call site + recovery (uniform wrapper)**
```python
from llm_sdk import call_model

result = call_model(
    template="refund_triage",         # registered prompt template
    inputs={"message": msg, "claim": claim},
    output_schema=RefundDecision,     # validated before return
    fallback={"action": "escalate"},  # returned when retries are exhausted
    idempotency_key=claim_id,         # for any side-effecting retry
)
# result is guaranteed to satisfy output_schema OR be the declared fallback —
# a malformed/timed-out/refused call never flows through unrecovered.
```

**Recovery spec (`prompts/<name>/recovery.yaml`)**
```yaml
refund_triage:
  output_schema: schemas/refund_decision.json   # JSON schema, or `freeform`
  retry:
    on: [timeout, rate_limit, parse_failure]
    backoff: exponential                          # default applied if omitted
    max_attempts: 3
  fallback:
    action: escalate                              # route-to-human on exhaustion
summarise_doc:
  output_schema: freeform
  fallback:
    strategy: degraded                            # return extractive summary instead
```

**Scope boundary** — this standard governs the cross-cutting recovery path, not the functional correctness of the model's answer (the project's own job, unit-tested by them). Output *safety* is GS2B1-01's concern, agent *run length* is GC5B1-01's; this is the recover-from-a-bad-call face. Where the provider offers strict structured-output / JSON mode, it satisfies the validate step — but the contract still covers the transient failures, truncation, refusals, and empty-retrieval cases those modes do not.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the quarterly recovery-effectiveness review are the mechanical evidence.

- [ ] Every model call site declares an `output_schema` and a `fallback` in its recovery spec — gate 1 lint passes on the integration branch.
- [ ] No model call is made except through the central wrapper (`call_model`) — gate 2 AST lint passes on the integration branch.
- [ ] Both lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] Side-effecting calls carry an idempotency key so a retry cannot fire the effect twice.
- [ ] The quarterly recovery-effectiveness review has been run; emitted fallback/parse-failure/retry rates meet the declared threshold; a sample of fallbacks is confirmed to leave the workflow in a safe state; shortfalls tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove a schema and fallback are declared and the call is routed — the plumbing. They cannot prove the fallback is the *right* one for the workflow or that the schema matches what the next step truly needs; a workflow that "recovers" by silently returning a wrong default passes every lint. That is why the quarterly recovery-effectiveness review over emitted telemetry is a binding acceptance criterion, not an optional extra.
