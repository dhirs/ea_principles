# ADR — Region-completeness of an agent's tool and model surface

- **Status:** Accepted
- **Date:** 2026-06-27
- **Context source:** AWS Well-Architected GenAI Lens GENREL05 (Distributed availability), BP03 "Verify that agent capabilities are available across all regions of availability"
- **Catalogue decision:** GENREL05-BP03 **not_promoted** — no standalone, enforceable, AI-specific principle survives as a new standard. This ADR records the recommendation we give projects instead.

## Problem

When a multi-region GenAI workload fails over to a backup Region for reliability, a stateless web service just works there. An **agent** does not. An agent's behaviour depends on its **tool surface** (the APIs/functions it can call) and its **model access**. If either is not provisioned in the failover Region, the agent does not fail cleanly — it keeps running with a missing tool or a different/unavailable model, and silently produces a degraded answer. The failure is invisible: no 5xx, no alarm, just worse output.

This is the agent-specific edge that base-WAF REL10 (multi-AZ/multi-region fault isolation) does not address. REL10 reasons about "the service" as the failover unit; for an agent the real failover unit is **the whole tool + model surface**, and partial availability degrades silently rather than erroring.

## Why no principle

The AWS mechanism is generic infra/landing-zone — deploy the supporting APIs/functions in N Regions, route with CloudFront / Route 53 latency-based routing, configure model access per Region. None of that is a commitable workload-repo artefact or a CI gate.

The agent-distinct part — "the tool + model surface must be identical in every target Region" — is real but does not justify a new standard:

- The tool-binding declaration already exists on **GO2B3-01** (every tool binding declares `side_effecting` + `idempotency_key | idempotent: false`). A region-completeness check is an **extension of that existing config**, not a new artefact.
- Model-access-per-Region is covered by **GO1B1-06**'s approved-model catalog (which model, resolved to immutable versions) plus landing-zone Region enablement.
- Routing/topology is base-WAF.

step_promotion score: 3/3/3/3 → not_promote.

## Recommendation

For any agent workload that can serve from more than one Region:

1. **Treat the agent's tool + model surface as the failover unit.** List, per agent, every tool binding and every model it calls. Region-completeness means that entire list is provisioned and reachable in every Region the agent can run in.

2. **Make it checkable, not aspirational.** Declare the agent's target Regions alongside its tool bindings (the GO2B3-01 config is the natural home). A deploy-time check confirms each declared tool endpoint and model is enabled in each target Region before the Region is marked active for that agent.

3. **Fail closed, not silent.** If a Region is missing a tool or model the agent needs, the agent must not serve from that Region — remove it from rotation rather than run degraded. Silent capability loss is worse than a clean failover to a complete Region.

4. **Keep model access explicit.** If the agent is not using a cross-Region inference profile, enable model access in every target Region (GO1B1-06 catalog + Region enablement). A floating "nearest model" must still resolve to an approved, catalogued version everywhere.

## Future work

If region-completeness recurs as a real production failure, the cleanest home is an **optional `target_regions` field on the GO2B3-01 tool-binding config** plus an existence/reachability check — a schema extension, logged here, not a standard. Flagged for the next agentic-reliability pass alongside the GR3B1-01/GR3B2-01 EU AI Act Art 15 follow-up.
