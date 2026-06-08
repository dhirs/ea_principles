# Reference Implementation — GS5B1-01

## 1. principle_id
GS5B1-01 — Put every consequential agent action through a gate before it runs. Every agent draws its tools from a declared manifest (each tool carries `scope` + `class` read/write, and every write declares a `gate` — human confirmation or a deterministic policy check); the agent loop executes tools only through a central wrapper, never by calling a tool directly. Three pre-merge lints enforce declaration completeness, routed execution (no tool reached except through the wrapper), and consequential-implies-gated. Action-side member of the Security guardrail family (input GS4B2-01 / output GS2B1-01 / retrieval GS1B3-01). (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — an agent taking unauthorised financial or data actions in regulated industries could push toward yes; held at no-borderline parallel to GS2B1-01 / GS4B2-01).
- D2 (repeatability_cost): 3 — a central agent SDK (the `@tool` decorator + tool registry + `run_tool` wrapper + policy dispatcher with the uniform `(ctx) -> bool` contract + the routed-execution AST lint + the confirmation/policy gate executor + the red-team action corpus + per-runtime adapters). Weeks of platform/security engineering per project if rebuilt locally.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints plus the quarterly agent red-team results are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `agent-sdk` action path — `run_tool(name, args)` builds the toolbelt from the manifest, runs a write tool's gate before executing, and returns the gate's block action on a fail. The `@tool(scope=..., klass=..., gate=...)` decorator + tool registry. Standalone wrapper for runtimes not on the central LLM SDK (GO3B1-01).
- Policy dispatcher — `run_policy(gate, ctx)` resolves `policy:<name>` to a registered function; the fixed `(ctx) -> bool` signature contract, where `ctx` carries tool args, user, and agent.
- Per-runtime adapters — `agent_sdk.adapters.bedrock_agents`, `.langgraph`, `.custom_loop` — mapping the canonical manifest + gate contract onto each runtime's tool-execution API.
- Tool-manifest schema at `agent-schema/tools.v1.yaml` — per tool `scope`, `class` (read/write), `gate` (`confirm` / `policy:<name>`).
- Routed-execution AST lint plugin (the GO3B1-01 no-inline pattern, action plane) + declaration-completeness + consequential-implies-gated lints (incl. the unattended-write-needs-policy rule); CI workflow templates.
- Agent red-team fixture framework — an adversarial action corpus (ordinary requests that must not trigger a consequential tool, injection payloads aimed at write tools, reasoning traps tempting an out-of-scope action) run through the gated agent via GO1B1-01's harness; escape-rate report vs threshold.
- SDK version floor at `agent-schema/sdk_floor.txt`.

**Operates**
- Semver on the agent SDK; adapter maintenance as runtimes evolve.
- Maintains the red-team action corpus and the escape-rate threshold; runs/coordinates the quarterly review with security.
- Publishes baseline write-classification guidance (what counts as irreversible / externally-visible) and reference policy patterns.

**Owns paths**
- `<platform-repo>/agent-sdk/` and `/adapters/`.
- `<platform-repo>/agent-schema/` — tool-manifest schema, sdk_floor, red-team corpus, CHANGELOG.
- `<platform-repo>/agent-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `agents/<name>/tools.yaml` (or `@tool` decorator metadata) — per tool: `scope`, `class` (read/write), and for writes a `gate` (`confirm` / `policy:<name>`).
- `agents/<name>/tools.yaml` pins the agent SDK version (≥ floor).
- `.github/workflows/agent-action-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Agent loop — executes every tool through `run_tool(name, args)`; never calls a tool function directly or assembles a toolbelt outside the manifest.
- Policy functions — the deterministic `(ctx) -> bool` rule behind each `policy:<name>` (only the project knows "refund ≤ claim amount AND claim approved").
- Workload-specific classifications and scopes — which tools are writes, each tool's least-privilege execution role, and the confirmation copy for `confirm` gates.

**Consumes via**
- `pip install agent-sdk` (or language equivalent), or the action path on the existing central LLM SDK.
- GitHub Actions: `uses: <org>/agent-workflows/.github/workflows/agent-action-check.yml@v1`.
- Quarterly efficacy review: submit the workload's agent + manifest to the central agent red-team run.

---

## 5. interface_contract

**Tool registration + agent loop**
```python
from agent_sdk import tool, run_tool

@tool(scope="refund <= claim.amount", klass="write", gate="policy:refund_ok")
def issue_refund(claim_id, amount): ...

@tool(klass="read")
def lookup_claim(claim_id): ...

# agent loop — every tool goes through the wrapper
while True:
    resp = llm.generate(messages, tools=registry.schemas())
    if resp.tool_call:
        result = run_tool(resp.tool_call.name, resp.tool_call.args)  # gate enforced here
        messages.append(tool_result(result))
    else:
        return resp.text
```

**Policy (uniform signature)**
```python
from agent_sdk import policy

@policy("refund_ok")
def refund_ok(ctx):                       # every policy is (ctx) -> bool
    c = get_claim(ctx.args["claim_id"])
    return c.status == "approved" and ctx.args["amount"] <= c.amount
```

**Tool manifest (`agents/<name>/tools.yaml`)**
```yaml
issue_refund:
  scope: "refund <= claim.amount"
  class: write
  gate:  policy:refund_ok        # unattended pipeline: must be a policy, not confirm
send_email:
  scope: "to in {internal_directory}"
  class: write
  gate:  confirm                 # interactive agent: human approval
lookup_claim:
  class: read
```

**Scope boundary** — the manifest declares each tool's `scope`; the least-privilege execution role behind it (AWS GENSEC05-BP01 steps 1-3 — scoped policies, permission boundaries, SCPs) is base-WAF IAM, which this principle depends on rather than re-implements. Input screening is GS4B2-01's concern, output validation GS2B1-01's, retrieval authorization GS1B3-01's; this governs the agent's actions.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the quarterly agent red-team report are the mechanical evidence.

- [ ] Every registered tool declares `scope` and `class` in the manifest — gate 1 lint passes on the integration branch.
- [ ] No tool is invoked except through the central wrapper (`run_tool`) — gate 2 AST lint passes on the integration branch.
- [ ] Every write-classed tool declares a `gate` (`confirm` or a registered `policy:<name>`); unattended writes carry a policy gate — gate 3 lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly agent red-team has been run; escape-rate meets the declared threshold; classifications and scopes reviewed for honesty; shortfalls tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove consequential tools are declared, routed, and wired to a gate — the plumbing. They cannot prove a tool's `class` is honest or its `scope` minimal; a write mislabeled read, or an over-broad execution role, passes the build. That is why the quarterly agent red-team + blast-radius review is a binding acceptance criterion, not an optional extra.
