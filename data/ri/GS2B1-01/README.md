# Reference Implementation — GS2B1-01

## 1. principle_id
GS2B1-01 — Put every model response through a guardrail. Every path returning a foundation-model response to a user routes it through a guardrail (content/toxicity, denied topics, PII; grounding for RAG) and declares a fallback for when the guardrail trips. A pre-merge AST lint forbids returning a raw model response that bypasses the guardrail wrapper. (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — regulated industries such as financial advice and healthcare push toward yes; held at no-borderline parallel to GO3B2-01/02).
- D2 (repeatability_cost): 3 — a central guardrail wrapper on the LLM SDK, a config schema, grounding-engine integration, the routed-output AST lint, per-engine adapters (Bedrock Guardrails / Guardrails.AI / NeMo), and an efficacy-eval harness. Weeks of platform/security engineering per project if rebuilt locally.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints plus the quarterly red-team results are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `guardrail-sdk` integration on the central LLM SDK (GO3B1-01) — `generate(..., guardrail="<name>")` applies output filters and, on a trip, returns the declared fallback instead of model text. Standalone `apply_guardrail(text, config)` for paths not on the central SDK.
- Per-engine adapters — `guardrail_sdk.adapters.bedrock`, `.guardrails_ai`, `.nemo` — mapping the canonical config to each engine's API.
- Guardrail config schema at `guardrail-schema/config.v1.yaml` — `output_filters` (content/toxicity, denied_topics, pii), `grounding`, `on_trip` (block_and_replace / disclaimer / escalate).
- Routed-output AST lint plugin (the GO3B1-01 no-inline pattern, output side) + declaration-completeness + grounding-required-for-RAG lints; CI workflow templates.
- Efficacy red-team fixture framework — an adversarial corpus (toxic prompts, prompt-injection attempts, ungrounded-answer bait, denied-topic probes) run through the guardrail via GO1B1-01's harness; trip-rate report vs threshold.
- SDK version floor at `guardrail-schema/sdk_floor.txt`.

**Operates**
- Semver on the guardrail SDK; adapter maintenance as engines evolve.
- Maintains the adversarial red-team corpus and the trip-rate threshold; runs/coordinates the quarterly efficacy review with security.
- Tunes default content-filter sensitivities; publishes denied-topic baselines.

**Owns paths**
- `<platform-repo>/guardrail-sdk/` and `/adapters/`.
- `<platform-repo>/guardrail-schema/` — config schema, sdk_floor, red-team corpus, CHANGELOG.
- `<platform-repo>/guardrail-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `guardrails/config.yaml` at repo root — per model-calling path: `output_filters`, `grounding` (on for RAG), `on_trip` fallback.
- `guardrails/config.yaml` pins the guardrail SDK version (≥ floor).
- `.github/workflows/guardrail-output-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Model-calling code — routes every user-facing response through `llm_sdk.generate(..., guardrail="<name>")` (or `apply_guardrail(...)`); never returns a raw model response directly.
- Fallback messages — the canned message / disclaimer text per `on_trip` action.
- Workload-specific denied topics (e.g. "investment_advice" for a retail-bank bot).

**Consumes via**
- `pip install guardrail-sdk` (or language equivalent), or the guardrail option on the existing LLM SDK.
- GitHub Actions: `uses: <org>/guardrail-workflows/.github/workflows/guardrail-output-check.yml@v1`.
- Quarterly efficacy review: submit the workload's guardrail config to the central red-team run.

---

## 5. interface_contract

**SDK call (on the central LLM SDK)**
```python
resp = llm_sdk.generate(
    template_id="support_answer",
    vars={...},
    guardrail="support_bot",   # applies output_filters; returns on_trip fallback if tripped
)
# resp.tripped: bool, resp.text: str (model text or fallback message)
```

**Guardrail config (`guardrails/config.yaml`)**
```yaml
support_bot:
  output_filters:
    content:        { toxicity: high, hate: high, violence: high }
    denied_topics:  [investment_advice]
    pii:            block
  grounding:        on            # required for RAG paths
  on_trip:
    action:  block_and_replace
    message: "I can't help with that — let me connect you to an advisor."
    escalate: human_queue
```

**Scope boundary** — the guardrail validates content/safety and grounding against the retrieved context only. It does NOT verify a response against a live backend (offer validity, account balance) — that is app-side business-logic verification, out of scope. Input-side prompt-injection defence is GENSEC04's concern.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the quarterly red-team report are the mechanical evidence.

- [ ] `guardrails/config.yaml` exists; every model-calling path declares `output_filters` + an `on_trip` fallback — gate 1 lint passes on the integration branch.
- [ ] No raw model response is returned to a caller without routing through the guardrail wrapper — gate 2 AST lint passes on the integration branch.
- [ ] Every RAG path (passes retrieved context to the model) has `grounding: on` — gate 3 lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly guardrail-efficacy red-team has been run; trip-rate meets the declared threshold; shortfalls are tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove a guardrail is wired in, a fallback is declared, and RAG grounding is on — the plumbing. They cannot prove the guardrail actually catches a given harmful output; that is its runtime recall, which is why the quarterly efficacy red-team is a binding acceptance criterion, not an optional extra.
