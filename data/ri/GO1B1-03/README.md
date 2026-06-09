# Reference Implementation — GO1B1-03

## 1. principle_id
GO1B1-03 — Measure quality the same way every time. The eval runner imports metrics by name and contains no inline scoring logic. Builds on GO1B1-01 / GO1B1-02.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no.
- D2 (repeatability_cost): 2 — encapsulation lint, runner-import contract, sibling-unit-test template are moderate platform infrastructure shared across projects. The metrics themselves remain project-local content.

---

## 3. central_team

**Builds**
- Metric module interface contract — required function signature, return shape, naming convention (`score(scenario_output, expected) -> float | bool | dict`).
- Encapsulation lint — static analysis that detects metric-shaped definitions (scoring functions, threshold comparisons, accuracy calculations) declared anywhere outside `eval/metrics/`. Flags inline scoring in adapters, scenario runners, or ad-hoc helpers.
- Runner integration in `eval-core` — imports metrics by name from `eval/metrics/`, refuses to score with anything else.
- Sibling unit test template — every metric module has a `<metric>_test.py` (or equivalent) with at least 3 positive and 2 negative test cases.
- Metric registry — auto-generated catalog of which metrics exist in which workload's `eval/metrics/`, surfaced on the dashboard.

**Operates**
- Semver on the metric module interface; migration guides on signature changes.
- Maintains the lint's heuristics for "metric-shaped" patterns; tunes false positives across projects.
- Reviews metric-registry growth; surfaces candidates for promotion to a shared metric library.

**Owns paths**
- `<platform-repo>/eval-core/metrics/` — interface contract, lint, runner integration, test template.
- `<platform-repo>/eval-core/metrics/shared/` — optional library of metrics promoted from project-local use (precision, recall, latency percentiles, grounding-score, brand-voice scorer template).

---

## 4. project_team

**Configures**
- `eval/metrics/` directory in the workload repo — one module per metric.
- Sibling unit tests next to each metric module.
- Metric references in scenario files (or in `eval/config.yaml`) use the metric's name from `eval/metrics/`, never inline expressions.

**Populates**
- The actual metric implementations — domain-specific scoring functions for the workload.
- Unit test cases per metric.

**Consumes via**
- `from eval.metrics.<metric_name> import score` pattern (or equivalent for non-Python adapters).
- `eval-core` shared metric library — projects can import `from eval_core.metrics.shared import precision_at_k` rather than re-implementing common metrics.
- The encapsulation lint runs as part of CI.

---

## 5. interface_contract

**Metric module signature**
```python
# eval/metrics/<metric_name>.py
def score(scenario_output: dict, expected: dict) -> dict:
    """
    Returns:
      { "passed": bool, "value": float | bool, "details": str }
    Must be deterministic for a given (scenario_output, expected) pair.
    No side effects, no external lookups.
    """
    ...
```

**File layout convention**
```
eval/metrics/
  <metric_name>.py
  <metric_name>_test.py
  __init__.py  (optional — explicit imports)
```

**Encapsulation lint rules**
- No file outside `eval/metrics/` may contain a function whose name matches metric-shaped patterns (`score_*`, `*_score`, `accuracy_*`, `precision_*`, `recall_*`, etc.) AND uses comparison operators on `expected` / `predicted` / `truth` arguments.
- Scenario files reference metrics by name string, not by inline expression.
- Adapters return raw output; never compute scores inline.

**Versioning**
- Metric interface follows `eval-core` semver. Adding a return field is MINOR. Changing the signature is MAJOR with a deprecation window.

---

## 6. acceptance_criteria

- [ ] `eval/metrics/` exists for every sub-workload that runs a harness.
- [ ] Every metric used in `eval/scenarios/` or `eval/config.yaml` resolves to a module under `eval/metrics/`.
- [ ] Every metric module conforms to the interface signature (verified by lint).
- [ ] Every metric module has a sibling `<metric>_test.py` with ≥ 3 positive and ≥ 2 negative cases.
- [ ] Encapsulation lint exits 0 — no metric-shaped definitions outside `eval/metrics/`.
- [ ] Encapsulation lint is configured as a **required** status check on the integration branch via branch protection.
- [ ] Metric unit tests pass on the integration branch.
