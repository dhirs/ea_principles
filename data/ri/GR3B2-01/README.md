# Reference Implementation — GR3B2-01

## 1. principle_id
GR3B2-01 — Don't let a stalled agent hang forever. Every agent run carries a `wall_clock_deadline` it cannot exceed plus a per-tool `timeout`, declared in the agent run config (the same artefact GC5B1-01's iteration/step/token caps live in). The run executes only through a central harness that applies the deadline by construction: on expiry it stops the run, runs the declared cleanup, and routes it to a dead-letter queue. `on_timeout` is constrained to `terminate`/`dead_letter` — never auto-retry unless every tool call is idempotent. Three pre-merge lints enforce declaration completeness, safe termination, and routed execution; timeout efficacy is watched via emitted telemetry and a quarterly review. Second GENREL03 standard; the reliability twin of the run-length cap GC5B1-01. (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — a hung agent run is a reliability failure, not an inherent regulatory exposure.
- D2 (repeatability_cost): 3 — a central agent harness (deadline enforcer, cleanup hooks, DLQ routing, the routed-execution AST lint, telemetry hooks). Weeks of platform engineering per project if rebuilt locally; the same "Centralised LLM SDK" tier calibration as GR3B1-01. Shares the harness and run-config artefact with GC5B1-01.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints plus the quarterly timeout-effectiveness review are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `agent-harness` run path — `run(...)` applies the declared `wall_clock_deadline` by construction: on expiry it stops the run, invokes the declared cleanup, and routes the run to the dead-letter queue. Enforces per-tool `timeout` on each tool call (abandons a call that blocks past its timeout).
- Run-config schema at `llm-schema/run_timeout.v1.yaml` — `wall_clock_deadline`, per-tool `timeout`, `on_timeout` (`terminate` / `dead_letter`), optional idempotency flags per tool binding.
- Routed-execution AST lint plugin (the GO3B1-01 / GR3B1-01 no-inline pattern, applied to the run plane) + declaration-completeness lint + safe-termination lint (forbids auto-retry on timeout unless all tool calls are idempotent); CI workflow templates.
- Dead-letter queue + graceful-termination primitive (cleanup hook contract).
- Telemetry hooks — emits deadline-fired, tool-abandoned, and routed-to-DLQ rates through GO3B2-01's channel, tagged by run and workload.
- SDK version floor at `llm-schema/sdk_floor.txt`.

**Operates**
- Semver on the agent harness; maintains the deadline-enforcement, cleanup, and DLQ behaviour.
- Maintains the timeout-effectiveness dashboard and the timeout-rate threshold; runs/coordinates the quarterly review.
- Publishes baseline guidance on sizing a `wall_clock_deadline` and writing a safe cleanup hook.

**Owns paths**
- `<platform-repo>/agent-harness/` — the run executor, deadline enforcer, cleanup + DLQ routing.
- `<platform-repo>/llm-schema/` — run-timeout schema, sdk_floor, CHANGELOG.
- `<platform-repo>/llm-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `agents/<name>/run.yaml` (the agent run config, alongside GC5B1-01's caps) — `wall_clock_deadline`, per-tool `timeout`, `on_timeout`.
- pins the agent-harness/SDK version (≥ floor).
- `.github/workflows/timeout-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Run entrypoints — start every agent run through `run(...)`; never drive the agent loop inline.
- The `wall_clock_deadline` for each run — the real SLA for *this* workflow (only the project knows the fulfilment agent must answer within 30s).
- The per-tool `timeout` for each tool binding — how long *this* tool may block before it is abandoned.
- The `on_timeout` action — `terminate` or `dead_letter`; mark tool calls idempotent only where they truly are, to permit retry.

**Consumes via**
- `pip install agent-harness` (or language equivalent).
- GitHub Actions: `uses: <org>/llm-workflows/.github/workflows/timeout-check.yml@v1`.
- Quarterly efficacy review: the workload's emitted timeout-rate telemetry against the declared threshold.

---

## 5. interface_contract

**Run entrypoint (uniform harness)**
```python
from agent_harness import run

result = run(
    agent="order_fulfilment",          # registered agent definition
    inputs={"order_id": order_id},
    wall_clock_deadline="30s",          # whole-run deadline, fires regardless of activity
    on_timeout="dead_letter",           # never silently retried; routed to DLQ
)
# the run is guaranteed to finish within the deadline OR be terminated and
# dead-lettered — a tool that never responds can never hang the run forever.
```

**Run-timeout spec (`agents/<name>/run.yaml`)**
```yaml
order_fulfilment:
  wall_clock_deadline: 30s
  on_timeout: dead_letter            # terminate | dead_letter (never auto-retry unless idempotent)
  tools:
    inventory_api:
      timeout: 5s
    carrier_api:
      timeout: 8s
    send_confirmation_email:
      timeout: 5s
      idempotent: false              # → run cannot be auto-retried on timeout
```

**Scope boundary** — this standard governs the run-level deadline + safe termination, not the functional correctness of the agent's work (the project's job). Agent *run length* (iterations/steps/tokens) is GC5B1-01's concern; recovering a single call that *returns* an error is GR3B1-01's; this is the hang-on-an-unresponsive-dependency face, which fires even when nothing returns. Tool-call **idempotency** (making the calls safe to replay) is a distinct, not-yet-authored concern; until it exists the safe-termination rule defaults to no-auto-retry.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the quarterly timeout-effectiveness review are the mechanical evidence.

- [ ] Every agent run declares a non-zero `wall_clock_deadline` and a per-tool `timeout` on every tool binding — gate 1 lint passes on the integration branch.
- [ ] `on_timeout` is `terminate` or `dead_letter`; no run auto-retries on timeout unless all its tool calls are marked idempotent — gate 2 lint passes.
- [ ] No agent run is started except through the central harness (`run`) — gate 3 AST lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly timeout-effectiveness review has been run; emitted deadline-fired/tool-abandoned/DLQ rates meet the declared threshold; a sample of terminated runs is confirmed to leave the workflow in a safe state (no stranded side effect, no double-fire); shortfalls tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove the deadline is declared, applied, un-bypassed, and retry-safe by declaration — the plumbing. They cannot prove the deadline fires correctly under live load, that the value is right-sized, or that the cleanup actually leaves a safe state; a run that "terminates" but strands a half-completed side effect passes every lint. That is why the quarterly timeout-effectiveness review over emitted telemetry is a binding acceptance criterion, not an optional extra.
