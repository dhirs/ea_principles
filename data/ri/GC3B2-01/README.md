# Reference Implementation — GC3B2-01

## 1. principle_id
GC3B2-01 — Keep the cost of every response under deliberate control. Every registered prompt template declares a real `runtime_token_budget.output` ceiling (the field GO3B1-01 already carries); the central SDK applies it as the call's `max_tokens` by construction, a pre-merge gate fails the build when the ceiling is unset or when a call site bypasses it with its own higher cap, and a second gate requires a recorded rationale when a ceiling is raised.

This RI is built on **Option A (declared-and-bound, manifest-derivable)** — the principle's mandated spine. Options B (declared stop sequences) and C (runtime alarm) are documented at the end as alternative implementations a workload may adopt **in addition to** Option A; they are not a substitute for the Option A gate.

The output side differs from GC3B1-01 in one essential way: **output length cannot be computed at build time** — it is a runtime quantity. The gate therefore proves the cap is *declared, applied, and un-bypassed*, never that a response was N tokens. See §7 enforcement limit.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — capping output tokens against a declared ceiling is cost discipline; no regulator, external audit, or litigation exposure.
- D2 (repeatability_cost): 2 — a declaration lint + an AST no-bypass lint + a budget-inflation governance lint, shipped in the central `llm-sdk` suite and reused across projects. Thinner than GC3B1-01's D2 because it adds **no new tokenizer computation** — it extends GO3B1-01's existing no-inline AST lint with one output-cap parameter and reads a manifest field; still beyond what each project should rebuild locally.

Validation stays project-architect self-attestation against the central tooling; CI logs are the mechanical evidence. Same shape as GO3B1-01, GC3B1-01, and GC2B2-01 — the enterprise tier is about who builds the lint, not who clicks a URL.

---

## 3. central_team

**Builds**
- `output_budget_check` lint plugin (shipped inside the GO3B1-01 `llm-sdk` lint suite) — fails the PR for any registered template whose `runtime_token_budget.output` is absent or zero.
- Extension to GO3B1-01's no-inline routing AST lint — fails any model call site that passes its own output-cap parameter (`max_tokens` / `max_output_tokens` / provider equivalent) directly to the model, bypassing the SDK's application of the registered ceiling. A non-literal (variable/computed) override fails outright; a literal override is permitted only when ≤ the template's declared `runtime_token_budget.output`.
- SDK behaviour: when no override is present, the `llm-sdk` looks up the template's `runtime_token_budget.output` and applies it as the call's `max_tokens` by construction.
- `output_budget_inflation_check` lint plugin — diffs `prompts/manifest.yaml` against the merge base; fails any PR that raises a template's `runtime_token_budget.output` without an accompanying budget-change rationale (manifest `change_history` entry or linked ADR under `docs/adrs/`).
- CI workflow template extension — adds the output lints to the existing `llm-sdk-lint.yml` reusable workflow.

**Operates**
- Versioning on the output lints in step with the `llm-sdk` semver and `sdk_floor.txt` floor.
- On-call for output-lint breakage hitting multiple projects.

**Owns paths**
- `<platform-repo>/llm-sdk/lints/output_budget_check/`
- `<platform-repo>/llm-sdk/lints/output_budget_inflation_check/`
- `<platform-repo>/llm-sdk/` — the SDK code path that applies the declared ceiling as `max_tokens`.
- `<platform-repo>/llm-sdk-workflows/` — the extended reusable lint workflow.

---

## 4. project_team

**Configures**
- The existing `prompts/manifest.yaml` (Mode A) or TMS metadata (Mode B) from GO3B1-01 — sets a **real** `runtime_token_budget.output` per template (a cap derived from the response the task actually needs, not a placeholder).
- `.github/workflows/llm-sdk-lint.yml` — already calls the central reusable workflow; pin the `llm-sdk` version that contains the output lints + the ceiling-applying SDK behaviour.
- Branch protection — the output lints are wired as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based), alongside GO3B1-01's and GC3B1-01's lints.

**Populates**
- Call sites that go through the SDK without passing their own output-cap parameter (let the registry's ceiling apply), or — if an override is genuinely needed — a literal ≤ the declared ceiling.
- A budget-change rationale (manifest `change_history` entry or `docs/adrs/` ADR) each time a `runtime_token_budget.output` is raised, recording the reason and the per-call output-token cost delta.

**Consumes via**
- `pip install llm-sdk` (or the language-equivalent) pinned at a version ≥ the floor that ships the output lints + ceiling-applying behaviour.
- GitHub Actions: `uses: <org>/llm-sdk-workflows/.github/workflows/llm-sdk-lint.yml@v1`.

---

## 5. interface_contract

**Budget field (already in the GO3B1-01 manifest row — this principle enforces the `output` half)**
```yaml
templates:
  - id: claims_summary
    version: 2.1.0
    body: prompts/claims_summary.md
    model: claude-sonnet-4-6
    runtime_token_budget:
      input: 2000
      output: 512          # ENFORCED ceiling: must be present + non-zero; SDK applies it as max_tokens
    stop_sequences: ["\n\nEND"]   # optional (Option B)
    owner: claims-platform
    status: active
```

**Gate 1 — declaration + no-bypass (pre_merge, blocking)**
```
For every template:
  FAIL if runtime_token_budget.output is absent or 0
For every model call site (AST):
  if it passes its own output-cap param (max_tokens / max_output_tokens / provider equiv) to the model:
    FAIL if the value is a variable/computed expression          # cannot be statically bounded
    FAIL if the value is a literal > declared runtime_token_budget.output
  else:
    SDK applies declared runtime_token_budget.output as max_tokens by construction
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

**Gate 2 — budget-inflation governance (pre_merge, blocking)**
```
For each template changed in the PR (diff vs merge base):
  if runtime_token_budget.output increased:
    REQUIRE a rationale: a manifest change_history entry on that row,
      OR a linked ADR under docs/adrs/ naming the reason + per-call output-token cost delta
  FAIL if the increase has no accompanying rationale
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every registered template declares a non-zero `runtime_token_budget.output` that reflects a real cap, not a placeholder.
- [ ] No model call site passes an output-cap parameter that bypasses the registered ceiling (no variable override; no literal override above the declared budget) — Gate 1 passes on the integration branch.
- [ ] No PR raises a `runtime_token_budget.output` without an accompanying budget-change rationale — Gate 2 passes on the integration branch.
- [ ] The pinned `llm-sdk` version is ≥ the floor that ships the output lints and the ceiling-applying SDK behaviour.
- [ ] Both output lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.

---

## 7. Enforcement limit (read this)

The gate proves the output ceiling is **declared, applied by the SDK, and un-bypassed**. It does **NOT** prove the model actually halts at that many tokens under live load (runtime behaviour), nor that the chosen ceiling is the *right* one. The response does not exist at build time, so no pre-merge check can measure its length. Runtime truncation behaviour is observed via Option C; ceiling appropriateness is handled by the Gate 2 inflation review. This is the "wired-in, not runtime behaviour" limit recorded in `enforcement_limits.md`.

---

## 8. Alternative implementations (optional, additive to Option A)

A workload MAY adopt either or both **in addition to** the Option A gate above; neither replaces it.

**Option B — declared stop sequences.** Declare optional `stop_sequences` per template in the manifest; the SDK passes them so the model halts on a recognised terminator as well as at the hard `max_tokens` cap. Useful for structured outputs with a natural end marker. A lint can confirm a stop sequence is *declared*, never that it is effective.

**Option C — runtime alarm.** GO3B2-01's SDK already emits a per-call actual-output-token signal. Wire it into an alarm (the GC2B2-01 alarm pattern) that pages or dashboard-flags when production output tokens hit the declared ceiling on most calls (a sign the cap is masking a too-verbose prompt) or when an uncapped path exceeds it. Post-deploy observability, not a pre-merge gate — it complements the CI gate rather than substituting for it, and is closer to the GO3B2 family.
