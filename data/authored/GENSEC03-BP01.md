# GENSEC03-BP01

- **Key:** `GENSEC03-BP01`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENSEC03-BP01 (whole BP — "Implement control plane and data access monitoring to generative AI services and foundation models"; AWS verbatim fetched 2026-06-07, 6 step-groups, risk **High**) | not_promoted — no principle authored. GENSEC03 ("How do you monitor and audit events associated with your generative AI workloads?", focus area "Event monitoring") ships exactly one BP; this closes the focus area. A broad monitoring umbrella (performance / quality / security / cost / audit-trail / compliance monitoring) via CloudTrail (management + data events) + CloudWatch. **User directed not_promote 2026-06-07.** Three grounds: (1) generic control-plane/data-plane monitoring owned by the base WAF — AWS cross-references SEC04-BP01; (2) vendor menu (CloudTrail / CloudWatch / SageMaker Lakehouse / Q in QuickSight); (3) umbrella whose sub-concerns are each already owned — telemetry/audit → GO3B2-01/02, eval/quality → GO1B1, cost → GENCOST family / GO3B2, and it overlaps GENSEC01-BP04 (access monitoring, not_promoted) + the security-monitoring slice partly covered by GS1B3-01. The prompt-injection / data-leakage detection lines ride GO3B2's trace stream, not a distinct artefact. step_promotion would fail `architecturally_distinct` + `not_vendor_menu`. **GENSEC03 CLOSED.**
