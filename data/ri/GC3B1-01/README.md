# Reference Implementation — GC3B1-01

## 1. principle_id
GC3B1-01 — Keep the cost of every prompt under deliberate control. Every registered prompt template declares a real `runtime_token_budget.input` ceiling (the field GO3B1-01 already requires); a pre-merge gate computes the template's declared-worst-case input footprint and fails the build when it exceeds the ceiling, and a second gate requires a recorded rationale when a ceiling is raised.

This RI is built on **Option A (declared-worst-case, manifest-derivable)** — the principle's mandated spine. Options B (measured-from-fixtures) and C (runtime alarm) are documented at the end as alternative implementations a workload may adopt **in addition to** Option A; they are not a substitute for the Option A gate.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — counting prompt tokens against a declared ceiling is cost discipline; no regulator, external audit, or litigation exposure.
- D2 (repeatability_cost): 2 — a footprint-vs-budget lint plus a budget-inflation governance lint, with ongoing tokenizer maintenance, reused across projects. Thinner than GO3B1-01's D2=3 because it extends GO3B1-01's existing tokenizer integration and manifest schema rather than building new ones; still beyond what each project should rebuild locally.

Validation stays project-architect self-attestation against the central tooling; CI logs are the mechanical evidence. Same shape as GO3B1-01 and GC2B2-01 — the enterprise tier is about who builds the lint, not who clicks a URL.

---

## 3. central_team

**Builds**
- `budget_check` lint plugin (shipped inside the GO3B1-01 `llm-sdk` lint suite) — for each registered template, computes the declared-worst-case input footprint = static scaffolding tokens (template body tokenised via the model's own tokenizer, `{{variable}}` placeholders excluded) + Σ declared variable `typical_max`; fails the PR when footprint > `runtime_token_budget.input`, or when `runtime_token_budget.input` is absent or zero.
- `budget_inflation_check` lint plugin — diffs `prompts/manifest.yaml` against the merge base; fails any PR that raises a template's `runtime_token_budget.input` or a variable's `typical_max` without an accompanying budget-change rationale (manifest `change_history` entry or linked ADR under `docs/adrs/`).
- Reuse of GO3B1-01's per-provider tokenizer adapters (`llm_sdk.tokenizers.{anthropic,openai,bedrock,azure}`) — no new tokenizer code; the budget lint calls the same adapters so the token count matches what the SDK measures at runtime.
- CI workflow template extension — adds the two budget lints to the existing `llm-sdk-lint.yml` reusable workflow.
- Optional cross-project prompt-cost dashboard surface — per-template declared budget vs computed footprint vs (if Option B/C adopted) measured/runtime tokens.

**Operates**
- Versioning on the budget lints in step with the `llm-sdk` semver and `sdk_floor.txt` floor.
- Tokenizer-adapter accuracy review (shared with GO3B1-01) — quarterly check of computed tokens against provider billing.
- On-call for budget-lint breakage hitting multiple projects.

**Owns paths**
- `<platform-repo>/llm-sdk/lints/budget_check/`
- `<platform-repo>/llm-sdk/lints/budget_inflation_check/`
- `<platform-repo>/llm-sdk-workflows/` — the extended reusable lint workflow.

---

## 4. project_team

**Configures**
- The existing `prompts/manifest.yaml` (Mode A) or TMS metadata (Mode B) from GO3B1-01 — sets a **real** `runtime_token_budget.input` per template (a cap derived from the workload's cost target, not a placeholder) and an honest `typical_max` per variable.
- `.github/workflows/llm-sdk-lint.yml` — already calls the central reusable workflow; no change needed beyond pinning the `llm-sdk` version that contains the budget lints.
- Branch protection — the two budget lints are wired as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based), alongside GO3B1-01's three lints.

**Populates**
- Prompt bodies kept within their declared ceilings.
- A budget-change rationale (manifest `change_history` entry or `docs/adrs/` ADR) each time a `runtime_token_budget.input` or variable `typical_max` is raised, recording the reason and the per-call input-token cost delta.

**Consumes via**
- `pip install llm-sdk` (or the language-equivalent) pinned at a version ≥ the floor that ships the budget lints.
- GitHub Actions: `uses: <org>/llm-sdk-workflows/.github/workflows/llm-sdk-lint.yml@v1`.

---

## 5. interface_contract

**Budget fields (already in the GO3B1-01 manifest row — this principle enforces them)**
```yaml
templates:
  - id: triage_classifier
    version: 1.4.0
    body: prompts/triage_classifier.md
    variables:
      - name: case_text
        typical_max: 1200          # tokens; summed into declared-worst-case footprint
        on_overflow: truncate
    model: claude-sonnet-4-6
    runtime_token_budget:
      input: 2000                  # ENFORCED ceiling: scaffolding + Σ typical_max must be ≤ this
      output: 512
    owner: risk-platform
    status: active
```

**Gate 1 — footprint-vs-budget (pre_merge, blocking)**
For every template:
```
scaffolding_tokens = tokenize(model, body_with_placeholders_removed)
declared_worst_case = scaffolding_tokens + sum(v.typical_max for v in variables)
FAIL if declared_worst_case > runtime_token_budget.input
FAIL if runtime_token_budget.input is absent or 0
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

**Gate 2 — budget-inflation governance (pre_merge, blocking)**
```
For each template changed in the PR (diff vs merge base):
  if runtime_token_budget.input increased OR any variable.typical_max increased:
    REQUIRE a rationale: a manifest change_history entry on that row,
      OR a linked ADR under docs/adrs/ naming the reason + per-call input-token cost delta
  FAIL if the increase has no accompanying rationale
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every registered template declares a non-zero `runtime_token_budget.input` that reflects a real cap, not a placeholder.
- [ ] For every template, `scaffolding_tokens + Σ variable.typical_max ≤ runtime_token_budget.input` — Gate 1 passes on the integration branch.
- [ ] No PR raises a `runtime_token_budget.input` or a variable `typical_max` without an accompanying budget-change rationale — Gate 2 passes on the integration branch.
- [ ] The pinned `llm-sdk` version is ≥ the floor that ships the budget lints.
- [ ] Both budget lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.

---

## 7. Alternative implementations (optional, additive to Option A)

These give a workload tighter coupling to *real* cost than Option A's manifest-derivable estimate. A workload MAY adopt either or both **in addition to** the Option A gate above; neither replaces it.

**Option B — measured-from-fixtures.** Run each template through the workload's GO1B1 eval-harness fixtures, tokenise the fully assembled input (scaffolding + actual fixture fills) with the model tokenizer, and add a pre-merge gate that fails when the measured *typical* input footprint exceeds `runtime_token_budget.input`. Closer to real cost because it includes representative fills; cost is the coupling to fixture representativeness — weak fixtures make the gate either lenient or flaky. Requires the GO1B1 eval harness to exist.

**Option C — runtime alarm.** GO3B1-01's SDK already tokenises every call and emits an actual-vs-declared token signal. Wire that signal into an alarm (the GC2B2-01 alarm pattern) that pages or dashboard-flags when production input tokens exceed `runtime_token_budget.input` over an evaluation window. Catches pathological runtime fills that Options A and B cannot see (a single oversized RAG retrieval, an adversarial input). It is post-deploy observability, not a pre-merge gate — it cannot block a merge and is closer to the GO3B2 observability family, so it complements the CI gate rather than substituting for it.
