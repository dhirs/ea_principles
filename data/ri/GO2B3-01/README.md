# Reference Implementation — GO2B3-01

## 1. principle_id
GO2B3-01 — Make every side-effecting tool call safe to retry. Every tool binding in the agent run config declares whether it is `side_effecting` and, if so, an `idempotency_key` (a stable token derived from the call's inputs) or an explicit `idempotent: false`. Tool calls execute only through a central harness that attaches the declared key to each side-effecting call — so a retry that recomputes the same key is de-duplicated by the receiver instead of re-executed — and that refuses to auto-retry a tool marked unsafe. Three pre-merge lints enforce declaration completeness, the no-unsafe-retry rule, and routed execution. First standard promoted from GENOPS02 (focus area P12), anchoring GENOPS02-BP03 step 4 ("implement idempotent operations to facilitate safe retries"); the safety property GR3B1-01's retries and GR3B2-01's safe-termination defer to. (Option A — declared-and-routed.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — a double-fired action is a reliability/data-integrity failure, not an inherent regulatory exposure.
- D2 (repeatability_cost): 3 — a central agent harness (key computation + attachment, the no-unsafe-retry enforcement, the routed-execution AST lint). Weeks of platform engineering per project if rebuilt locally; the same "Centralised LLM SDK" tier calibration as GR3B1-01 / GR3B2-01. Shares the agent run config artefact and harness with GR3B2-01 and GC5B1-01.
- audit_mode: self_attestation_with_mechanical_evidence — the CI lints are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `agent-harness` tool-call path — `call_tool(...)` computes the declared `idempotency_key` for each `side_effecting` tool and attaches it to the call by construction; refuses to auto-retry any tool declared `idempotent: false`, handing the run to GR3B2-01's termination / dead-letter path instead of replaying it.
- Tool-binding schema at `llm-schema/tool_idempotency.v1.yaml` — `side_effecting`, `idempotency_key` (token expression), `idempotent` flag per tool binding.
- Declaration-completeness lint + safe-retry lint (forbids an unsafe tool on any retry path — GR3B1-01 retry config or GR3B2-01 `on_timeout: retry`) + routed-execution AST lint (the GO3B1-01 / GR3B1-01 no-inline pattern, applied to the tool-call plane); CI workflow templates.
- SDK version floor at `llm-schema/sdk_floor.txt`.

**Operates**
- Semver on the agent harness; maintains key-attachment and the no-unsafe-retry behaviour.
- Publishes baseline guidance on deriving a stable idempotency key from call inputs and on which tool classes are inherently read-only.

**Owns paths**
- `<platform-repo>/agent-harness/` — the tool-call executor, key computation/attachment, no-unsafe-retry enforcement.
- `<platform-repo>/llm-schema/` — tool-idempotency schema, sdk_floor, CHANGELOG.
- `<platform-repo>/llm-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `agents/<name>/run.yaml` (the agent run config, alongside GR3B2-01's timeouts and GC5B1-01's caps) — per tool binding: `side_effecting`, `idempotency_key` or `idempotent: false`.
- pins the agent-harness/SDK version (≥ floor).
- `.github/workflows/idempotency-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Tool call sites — issue every tool call through `call_tool(...)`; never call a side-effecting tool/provider inline.
- The `idempotency_key` expression for each side-effecting tool — the stable token that identifies *this* logical action (only the project knows that two charges with the same `order_id` are the same charge).
- The `idempotent: false` mark where a side-effecting tool genuinely cannot be made safe to repeat — accepting that such a tool is barred from auto-retry.

**Consumes via**
- `pip install agent-harness` (or language equivalent).
- GitHub Actions: `uses: <org>/llm-workflows/.github/workflows/idempotency-check.yml@v1`.

---

## 5. interface_contract

**Tool-call entrypoint (uniform harness)**
```python
from agent_harness import call_tool

# harness computes the declared key ("charge:{order_id}") and attaches it;
# a retry that recomputes the same key is de-duplicated by the receiver,
# not charged again.
result = call_tool(
    tool="charge_card",
    inputs={"order_id": order_id, "amount": amount},
)
```

**Tool-idempotency spec (`agents/<name>/run.yaml`)**
```yaml
order_fulfilment:
  tools:
    inventory_lookup:
      side_effecting: false            # read-only → inherently safe, no key
    charge_card:
      side_effecting: true
      idempotency_key: "charge:{order_id}"
    send_confirmation_email:
      side_effecting: true
      idempotency_key: "email:order_confirmation:{order_id}"
    legacy_fax_dispatch:
      side_effecting: true
      idempotent: false               # → barred from any auto-retry path
```

**Scope boundary** — this standard governs whether a retry is *safe*, not whether a retry *happens*. Deciding to retry a failed call is GR3B1-01's concern; deciding to stop a hung run is GR3B2-01's; capping run length is GC5B1-01's. GO2B3-01 supplies the idempotency declaration and key those standards defer to so their retries/replays do not duplicate a side effect. Read-only tools need no key.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every tool binding marked `side_effecting: true` declares either a non-empty `idempotency_key` or `idempotent: false` — gate 1 lint passes on the integration branch.
- [ ] No tool marked `idempotent: false` (or lacking a key) appears on an auto-retry path (GR3B1-01 retry config or GR3B2-01 `on_timeout: retry`) — gate 2 lint passes.
- [ ] No tool is invoked except through the central harness (`call_tool`) — gate 3 AST lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove the key is declared, attached by routing, and that unsafe tools are never auto-retried — the plumbing. They cannot prove the downstream provider honours the key and actually de-duplicates a replay; a receiver that ignores the key still double-executes, and every lint still passes. By deliberate scope decision this standard does **not** mandate per-call telemetry to watch honoured-vs-ignored keys (it would add an emit-on-every-call burden for little marginal safety); the provider-honouring gap is an **accepted, documented limit**. A workload may surface duplicate-key events on GO3B2-01's existing span if it wishes, but nothing here requires it.
