# Reference Implementation — GO1B1-05

## 1. principle_id
GO1B1-05 — Keep the yardstick current with how the system is really used. Closes the loop with GO1B1-04 (drift detection without refresh discipline produces a permanently-firing alert against a never-updated baseline).

## 2. tier_outcome
**local** → `ownership.tier: project`
- D1 (legal_exposure): no.
- D2 (repeatability_cost): 1 — refresh discipline is mostly per-project (when to refresh, what to refresh, who owns the cycle). The supporting tooling (config schema, log validator) is light, single-digit hours per project. Project-tier; cheaper to centralise later if reuse evidence emerges.

---

## 3. central_team
**None — project owns end-to-end.**

A central team may optionally publish:
- A schema validator for `eval/refresh/config.yaml` and `eval/refresh/log.yaml` (small lint).
- A starter template documenting common cadences and trigger conditions.

Both are light enough that a project can write them itself; the only loss from going fully local is the central template's heuristics.

---

## 4. project_team

**Configures**
- `eval/refresh/config.yaml` — declares the refresh cadence (calendar-based, e.g. quarterly), any trigger conditions (e.g. drift alert fired, ≥ N customer-reported regressions accumulated, model version change), and the named owner per refresh cycle.

**Populates**
- `eval/refresh/log.yaml` — append-only audit trail. Each entry records: refresh date, owner, scenarios added, scenarios retired, scenarios updated, justification, link to PR.
- The refresh work itself on each cycle: review recent production behaviour, add scenarios for new failure modes, retire scenarios no longer representative, update expected_decisions where policy has changed.

**Consumes via**
- Whatever local validator the team writes; or the optional central schema validator.
- Drift alerts from GO1B1-04 should naturally surface refresh triggers — wire them through the project's normal ticketing.

---

## 5. interface_contract

**`eval/refresh/config.yaml` schema**
```yaml
cadence:
  type: calendar | event_triggered | both
  calendar: <cron-like or named period — e.g. "quarterly", "every 13 weeks">
  triggers:
    - drift_alert_severity: page          # any of these fires a refresh requirement
    - regression_count_threshold: 5
    - model_version_change: true
owner_per_cycle:
  default: <role or named individual>
  rotation: <list>                         # optional — rotates across the team
max_days_since_last_refresh: <int>         # CI gate fails if exceeded without ADR
```

**`eval/refresh/log.yaml` schema (append-only)**
```yaml
refreshes:
  - date: <ISO 8601>
    owner: <role or individual>
    cycle_trigger: scheduled | drift_alert | regression_threshold | model_change
    scenarios_added: <int>
    scenarios_retired: <int>
    scenarios_updated: <int>
    justification: <string>
    pr_link: <URL>
```

**CI gate (project-implemented, light validator)**
- Parses `eval/refresh/config.yaml` and `eval/refresh/log.yaml`.
- Fails if `max_days_since_last_refresh` exceeded AND no ADR under `docs/adrs/` justifies the gap.
- Fails if a drift alert at `page` severity is open without a corresponding refresh entry within 30 days.

---

## 6. acceptance_criteria

- [ ] `eval/refresh/config.yaml` exists and declares cadence, triggers, owner.
- [ ] `eval/refresh/log.yaml` exists and is append-only.
- [ ] Latest log entry's date is within `max_days_since_last_refresh`, OR an ADR justifies the gap with explicit TTL.
- [ ] Every drift alert at `page` severity in the last 90 days has a corresponding log entry within 30 days of the alert, OR an ADR documents why the alert did not require a refresh.
- [ ] CI gate (refresh-cadence check) is configured as a **required** status check on the integration branch via branch protection.
- [ ] Latest refresh-cadence check exits 0 on the integration branch.
