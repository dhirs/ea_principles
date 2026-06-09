# Reference Implementation — GO1B1-02

## 1. principle_id
GO1B1-02 — Judge an agent on its weakest group, not its average. Builds on GO1B1-01.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline yes in regulated industries where stratification covers protected attributes for fairness — depends on workload).
- D2 (repeatability_cost): 3 — strata-manifest validator, per-stratum threshold checker, coverage lint, strata-evolution diff all repeat across agentic projects.

---

## 3. central_team

**Builds**
- Strata manifest schema + validator — defines the shape of `eval/strata.yaml`, validates every declared stratum has a name, dimensions, min count, per-metric threshold.
- Stratum tagger — maps each scenario in `eval/scenarios/` to one or more strata via scenario `tags` or declarative rules in `strata.yaml`.
- Per-stratum runner extension to `eval-core` — emits per-stratum metrics (pass rate, count, latency per stratum) alongside aggregate. Fails the run if any stratum is below its declared min count OR below its per-stratum threshold.
- Coverage lint — verifies the strata in `strata.yaml` actually cover the workload's decision branches and tool paths (cross-checks against agent code via static analysis or declared mapping).
- Strata-evolution diff tool — detects when stratum membership counts drop between PRs, flags as warning.
- Template strata dimensions for common patterns (decision-branch strata, customer-segment strata, adversarial strata, protected-attribute strata where fairness applies).

**Operates**
- Semver on the strata schema; migration guides on schema bumps.
- Maintains the templates and coverage-check heuristics.
- On-call when coverage lint produces false positives across projects.

**Owns paths**
- `<platform-repo>/eval-core/strata/` — schema, validator, runner extension, coverage lint.
- `<platform-repo>/eval-core/strata/templates/` — common stratum-dimension templates.

---

## 4. project_team

**Configures**
- `eval/strata.yaml` — declares the workload's strata (name, dimensions, min count, per-metric threshold).
- Tags on each scenario file linking it to one or more strata (e.g. `tags: ["auto_approve", "premium_segment", "policy_clean"]`).
- Strata-to-decision-branch mapping in `strata.yaml` so the coverage lint can verify every branch is tested.

**Populates**
- Scenarios per stratum, meeting the declared min count.
- When new decision branches or customer segments emerge, add new strata + scenarios.
- Per-stratum thresholds calibrated to the workload's risk (e.g. REJECT stratum at 95% precision because false rejects are expensive; AUTO_APPROVE at 90%).

**Consumes via**
- `eval-core run --strata` (or the runner reads strata.yaml automatically when present).
- Coverage lint runs as part of CI; failures point at uncovered branches.

---

## 5. interface_contract

**`eval/strata.yaml` schema**
```yaml
strata:
  - name: <string — unique within file>
    dimensions:                          # how scenarios match this stratum
      tags_include: ["<tag>", ...]       # AND across tags; scenario must have all
      tags_exclude: ["<tag>", ...]       # scenario must have none
    min_count: <int>                     # minimum scenarios required
    thresholds:
      <metric_name>: <float>             # per-metric threshold for this stratum
    decision_branches:                   # optional — for coverage lint
      - <branch_name>
    notes: <string>                      # human context
```

**Scenario-side requirement**
- Every scenario in `eval/scenarios/` must have a `tags` field. Stratum membership is computed from these tags by the runner.

**Per-stratum result emission (in eval-core report output)**
```json
{
  "aggregate": { "passed": 47, "failed": 3, "pass_rate": 0.94 },
  "strata": {
    "<stratum_name>": { "count": 12, "passed": 11, "failed": 1, "pass_rate": 0.92, "met_min_count": true, "met_threshold": true },
    ...
  }
}
```

**Gating semantics**
- Run fails if **any** stratum has `met_min_count: false` OR `met_threshold: false`.
- Aggregate pass rate does NOT override per-stratum failure.
- A scenario can belong to multiple strata; it counts toward each one's min_count and pass rate independently.

**Versioning**
- Strata schema follows `eval-core` semver. Strata schema changes are MINOR; runner-extension changes are MAJOR.

---

## 6. acceptance_criteria

Project architect self-attests. CI logs and `eval-core report` output are the mechanical evidence.

- [ ] `eval/strata.yaml` exists for every agentic sub-workload and validates against the central strata schema.
- [ ] At least N strata declared (suggested: every declared decision branch from agent code is mapped to at least one stratum).
- [ ] Each stratum's `min_count` is ≥ a workload-appropriate floor (suggested floor: 5; risk-sensitive strata higher).
- [ ] Each stratum's `thresholds` block names at least one metric with a numeric threshold.
- [ ] Latest `eval-core run` emits per-stratum metrics; every stratum reports `met_min_count: true` and `met_threshold: true`.
- [ ] Coverage lint exits 0 — every decision branch in agent code maps to at least one declared stratum.
- [ ] CI job (the stratified harness check) is configured as a **required** status check on the integration branch via branch protection.
- [ ] Strata changes in PRs trigger the strata-evolution diff; any drop in stratum count is justified in the PR description or in an ADR.
