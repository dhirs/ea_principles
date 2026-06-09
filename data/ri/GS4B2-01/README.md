# Reference Implementation — GS4B2-01

## 1. principle_id
GS4B2-01 — Screen user input before it reaches the model. Every path that places user-influenced text into a foundation-model prompt routes it through an input guardrail (prompt-injection + prompt-extraction screening) before the call, declares prompt-size and request-rate limits, and declares an on_trip action. A pre-merge AST lint forbids passing raw user input to a model call that bypasses the input-guardrail wrapper. Input-side mirror of GS2B1-01. (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — regulated industries push toward yes; held at no-borderline parallel to GS2B1-01).
- D2 (repeatability_cost): 3 — a central input-guardrail wrapper on the LLM SDK, a config schema, injection-detection adapters (keyword / guardrails solution / LLM-as-a-judge), the routed-input AST lint, per-engine adapters (Bedrock Guardrails / Guardrails.AI / NeMo), and an injection red-team corpus. Weeks of platform/security engineering per project if rebuilt locally.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints plus the quarterly injection red-team results are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `guardrail-sdk` input path on the central LLM SDK (GO3B1-01) — `generate(..., input_guardrail="<name>")` screens user input before the model call and, on a trip, returns the declared action instead of calling the model. Standalone `apply_input_guardrail(text, config)` for paths not on the central SDK.
- Per-engine adapters — `guardrail_sdk.adapters.bedrock`, `.guardrails_ai`, `.nemo`, plus an LLM-as-a-judge adapter — mapping the canonical input config to each engine's API.
- Input-guardrail config schema at `guardrail-schema/input.v1.yaml` — `input_filters` (injection detection, prompt-extraction / sensitive-data probes), `limits` (`max_prompt_tokens`, `rate_limit`), `on_trip` (block_and_replace / escalate).
- Routed-input AST lint plugin (the GO3B1-01 no-inline pattern, input side) + declaration-completeness + limits-declared lints; CI workflow templates.
- Injection red-team fixture framework — a curated injection corpus (instruction-override attempts, prompt-extraction probes, tool-hijack payloads, sensitive-data-extraction attempts) run through the input guardrail via GO1B1-01's harness; catch-rate report vs threshold.
- SDK version floor at `guardrail-schema/sdk_floor.txt`.

**Operates**
- Semver on the guardrail SDK; adapter maintenance as engines evolve.
- Maintains the injection red-team corpus and the catch-rate threshold; runs/coordinates the quarterly efficacy review with security.
- Tunes default injection-detection sensitivities; publishes baseline injection patterns.

**Owns paths**
- `<platform-repo>/guardrail-sdk/` and `/adapters/`.
- `<platform-repo>/guardrail-schema/` — input config schema, sdk_floor, injection corpus, CHANGELOG.
- `<platform-repo>/guardrail-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `guardrails/input.yaml` at repo root — per user-influenced path: `input_filters`, `limits` (`max_prompt_tokens`, `rate_limit`), `on_trip` action.
- `guardrails/input.yaml` pins the guardrail SDK version (≥ floor).
- `.github/workflows/guardrail-input-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Model-calling code — routes every user-influenced prompt through `llm_sdk.generate(..., input_guardrail="<name>")` (or `apply_input_guardrail(...)`); never assembles raw user input into a model call directly.
- Reject messages — the canned message / escalation per `on_trip` action.
- Workload-specific injection patterns and limit values (e.g. tighter `max_prompt_tokens` for a short-form support bot).

**Consumes via**
- `pip install guardrail-sdk` (or language equivalent), or the input_guardrail option on the existing LLM SDK.
- GitHub Actions: `uses: <org>/guardrail-workflows/.github/workflows/guardrail-input-check.yml@v1`.
- Quarterly efficacy review: submit the workload's input-guardrail config to the central injection red-team run.

---

## 5. interface_contract

**SDK call (on the central LLM SDK)**
```python
resp = llm_sdk.generate(
    template_id="support_answer",
    vars={"user_message": user_text},
    input_guardrail="support_bot",   # screens user input; returns on_trip action if tripped
)
# resp.input_tripped: bool, resp.text: str (model text, or reject message if input tripped)
```

**Input-guardrail config (`guardrails/input.yaml`)**
```yaml
support_bot:
  input_filters:
    injection:   { instruction_override: on, prompt_extraction: on }
    sensitive:   pii_extraction_probe
  limits:
    max_prompt_tokens: 4000
    rate_limit:        "30/min/caller"
  on_trip:
    action:  block_and_replace
    message: "I can't process that request — let me connect you to an agent."
    escalate: human_queue
```

**Scope boundary** — the input guardrail screens user-influenced input for prompt-injection and prompt-extraction. The untrusted-input context boundary in the prompt template (delimiting user text so the model treats it as data) is enforced by GO3B1-01's template registry, which this principle depends on. Output-side response validation is GS2B1-01's concern; together they give full input+output coverage.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the quarterly injection red-team report are the mechanical evidence.

- [ ] `guardrails/input.yaml` exists; every user-influenced path declares `input_filters`, `limits`, and an `on_trip` action — gate 1 lint passes on the integration branch.
- [ ] No raw user input reaches a model call without routing through the input-guardrail wrapper — gate 2 AST lint passes on the integration branch.
- [ ] Every user-influenced path declares non-null `max_prompt_tokens` and `rate_limit` — gate 3 lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly prompt-injection red-team has been run; catch-rate meets the declared threshold; shortfalls are tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove an input guardrail is wired in, limits are declared, and user input is routed — the plumbing. They cannot prove the guardrail actually catches a given injection; that is its runtime recall, which is why the quarterly injection red-team is a binding acceptance criterion, not an optional extra.
