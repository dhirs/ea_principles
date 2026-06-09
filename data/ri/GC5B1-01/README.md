# Reference Implementation — GC5B1-01

## 1. principle_id
GC5B1-01 — Give every agent a limit it cannot run past. Every agent declares the ceilings that bound a single run (max reasoning/tool-call steps, max wall-clock duration, max per-run token/cost budget) plus the terminal action when a ceiling is hit; the agent is constructed so those ceilings are actually wired in; a pre-merge gate fails the build when the declaration is missing, when the agent entrypoint is constructed without the declared ceilings bound, or when a ceiling is raised without a recorded cost rationale.

This RI is built on **Option A (declared-and-wired, config/code-derivable)** — the principle's mandated spine. Option B (runtime circuit-breaker) is documented at the end as an alternative a workload may adopt **in addition to** Option A; it is not a substitute for the Option A gate.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — bounding an agent's run length against a cost ceiling is cost discipline; no regulator, external audit, or litigation exposure.
- D2 (repeatability_cost): 2 — a declaration-completeness lint plus a framework-aware wired-in-consistency parser (LangGraph / CrewAI / Bedrock / custom loop guards) plus a relaxation-governance lint, reused across projects with ongoing maintenance as orchestration frameworks evolve. Beyond what each project should rebuild locally; lighter than GC2B2-01 (which parses GPU/instance/precision and verifies deployed alarms) because it reads the agent's own construction code rather than full multi-cloud IaC.

Validation stays project-architect self-attestation against the central tooling; CI logs are the mechanical evidence. Same shape as the cost siblings — the enterprise tier is about who builds the lint, not who clicks a URL.

---

## 3. central_team

**Builds**
- `stop_check` lint plugin — for each agent, (1) verifies the `agent/run_limits.yaml` declaration exists and populates `max_steps`, `max_wallclock_seconds`, `max_run_token_budget`, `on_limit`, `estimated_max`, `checked_on`; (2) parses the agent's construction (the orchestration-framework limit) and fails when the agent entrypoint is constructed without the declared ceilings actually bound.
- `ceiling_relaxation_check` lint plugin — diffs `agent/run_limits.yaml` against the merge base; fails any PR that raises `max_steps`, `max_wallclock_seconds`, or `max_run_token_budget` without an accompanying rationale (declaration `change_history` entry or linked ADR under `docs/adrs/`).
- Framework construction-parser adapters (`agent.parsers.{langgraph,crewai,bedrock,custom}`) — read the wired-in step / duration / budget limit from each supported orchestration framework so the consistency check matches how the agent is actually built (LangGraph `recursion_limit`, CrewAI `max_iter` / `max_execution_time`, a Bedrock agent timeout, a custom loop-guard convention).
- CI workflow template — a reusable `agent-stop-lint.yml` running both lints.
- Optional cross-project agent cost dashboard surface — per-agent declared ceilings vs (if Option B adopted) observed run cost/step/duration distribution.

**Operates**
- Versioning on the lints and the parser adapters in step with the platform `agent` tooling semver.
- Parser-adapter accuracy review — quarterly check that the parsed wired-in limit matches the agent's real construction for each framework (frameworks rename and reshape their limit arguments).
- On-call for lint breakage hitting multiple projects.

**Owns paths**
- `<platform-repo>/agent/lints/stop_check/`
- `<platform-repo>/agent/lints/ceiling_relaxation_check/`
- `<platform-repo>/agent-workflows/` — the reusable lint workflow.

---

## 4. project_team

**Configures**
- `agent/run_limits.yaml` — declares `max_steps`, `max_wallclock_seconds`, `max_run_token_budget`, `on_limit`, the `estimated_max` that justified the ceilings, and `checked_on`.
- `.github/workflows/agent-stop-lint.yml` — calls the central reusable workflow; pin the `agent` tooling version that ships the lints.
- Branch protection — both lints wired as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).

**Populates**
- The runtime estimate behind `estimated_max` — sum the expected worst-case model-response, tool-execution, and network time (AWS step 1) and record the figure the ceilings are derived from.
- A ceiling-change rationale (declaration `change_history` entry or `docs/adrs/` ADR) each time a ceiling is raised, recording the reason and the per-run cost delta.

**Consumes via**
- `pip install agent-tools` (or the language-equivalent) pinned at a version ≥ the floor that ships the lints.
- GitHub Actions: `uses: <org>/agent-workflows/.github/workflows/agent-stop-lint.yml@v1`.

---

## 5. interface_contract

**Declaration (`agent/run_limits.yaml`)**
```yaml
agents:
  - id: claims_triage
    framework: langgraph                 # construction-parser adapter to use
    entrypoint: src/agents/claims_triage.py:build_graph
    max_steps: 25                         # ENFORCED: wired-in recursion_limit must match
    max_wallclock_seconds: 300            # ENFORCED: wired-in timeout must match
    max_run_token_budget: 200000          # tokens (or cost) a single run may consume
    on_limit: return_partial              # halt | return_partial | escalate
    estimated_max: "~6 steps / ~45s typical; ceilings ~4x for tail"
    checked_on: 2026-06-06
    owner: claims-platform
```

**Gate 1 — declaration + wired-in consistency (pre_merge, blocking)**
For every agent:
```
FAIL if agent/run_limits.yaml absent
FAIL if any of {max_steps, max_wallclock_seconds, max_run_token_budget, on_limit, estimated_max, checked_on} blank
wired_in = parse_agent_limits(entrypoint, framework)   # framework-specific adapter
FAIL if wired_in.step_limit   is unset OR > max_steps
FAIL if wired_in.time_limit   is unset OR > max_wallclock_seconds
```
The agent entrypoint must be constructed with the declared ceilings actually bound (a limit declared but not wired in stops nothing). Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

**Gate 2 — ceiling-relaxation governance (pre_merge, blocking)**
```
For each agent changed in the PR (diff vs merge base):
  if max_steps OR max_wallclock_seconds OR max_run_token_budget increased:
    REQUIRE a rationale: a change_history entry on that declaration,
      OR a linked ADR under docs/adrs/ naming the reason + per-run cost delta
  FAIL if the increase has no accompanying rationale
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every agent declares `max_steps`, `max_wallclock_seconds`, `max_run_token_budget`, `on_limit`, `estimated_max`, and `checked_on` — none blank.
- [ ] The declared ceilings are a deliberate choice derived from `estimated_max`, not a framework default taken unexamined or absent.
- [ ] The agent entrypoint is constructed with the declared step and duration ceilings actually bound — Gate 1 passes on the integration branch (a limit declared but not wired in fails).
- [ ] No PR raises a ceiling without an accompanying rationale — Gate 2 passes on the integration branch.
- [ ] The pinned `agent` tooling version is ≥ the floor that ships the lints.
- [ ] Both lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.

---

## 7. Alternative implementation (optional, additive to Option A)

This gives a workload live enforcement that the agent actually stops at its ceiling under load, rather than trusting that a wired-in limit behaves at runtime. A workload MAY adopt it **in addition to** the Option A gate above; it does not replace it.

**Option B — runtime circuit-breaker.** Instrument the run with a cost/step/duration meter that hard-stops the session when actual consumption crosses the declared ceiling (`max_steps`, `max_wallclock_seconds`, `max_run_token_budget`) and emits the stop event to the observability pipeline for attribution. Closer to guaranteeing the predictable-maximum-cost outcome AWS names because it bounds the run in production, not just at build time; cost is the coupling to runtime telemetry and the per-run metering overhead. Requires the observability substrate to exist (GO3B2 family) to record and route the stop events.
