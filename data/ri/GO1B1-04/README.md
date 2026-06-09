# Reference Implementation — GO1B1-04

## 1. principle_id
GO1B1-04 — Notice a model drifting before your users do. Catches the cumulative-drift failure mode that per-PR CI gates cannot (GO1B1-01/02/03 close the PR-time loop; this closes the post-deploy loop).

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — borderline yes in regulated industries where Model Risk Management regs (e.g. SR 11-7 in banking) mandate periodic monitoring. Workloads in those industries should treat this as mandatory_centralise.
- D2 (repeatability_cost): 3 — drift comparator, baseline storage, alert routing, model-version coupling are substantial platform infrastructure that would repeat as weeks of work per project if local.

---

## 3. central_team

**Builds**
- Drift config schema + validator — defines the shape of `eval/drift/config.yaml` and validates it (dimensions, baselines, cadence, thresholds, alert routing).
- Baseline storage service — versioned per model deployment; baseline pushed at deploy, fetched on every drift check, immutable once stored.
- Drift comparator engine — scheduled job (or `eval-core drift run`) that fetches recent production metrics for each declared dimension, compares against baseline, applies threshold logic, fires alerts.
- Alert router — abstracts the alert destination (PagerDuty, Slack, email, ticket creation) behind a config-driven dispatcher.
- Baseline-update coupling lint — CI gate that blocks PRs changing the model identifier, prompt, or training data unless the baseline is also refreshed or an ADR justifies the deferral.
- Cross-project drift dashboard — surfaces per-workload drift status, time-to-alert, baseline freshness, model-version coverage.

**Operates**
- Semver on the drift schema and comparator engine; migration guides on breaking changes.
- Operates the comparator's scheduled-job infrastructure (cron, queue, retry logic).
- On-call for the comparator service itself; routes project-side drift alerts to project on-call, not platform.
- Quarterly review of false-positive rate per project; tunes shared threshold heuristics.

**Owns paths**
- `<platform-repo>/eval-core/drift/` — schema, validator, comparator engine, alert router.
- `<platform-repo>/drift-baselines/` — baseline storage (object store + versioning).
- `<platform-repo>/drift-dashboard/` — cross-project surface.

---

## 4. project_team

**Configures**
- `eval/drift/config.yaml` — declares dimensions to monitor (e.g. AUTO_APPROVE rate, REJECT rate, retrieval-grounding score, output-token distribution), per-dimension baseline reference, cadence (hourly / daily / weekly), per-dimension thresholds (absolute or relative), alert destinations.
- Production telemetry plumbing — emits the metrics the drift comparator reads (typically a metrics endpoint or a metrics warehouse table the platform comparator queries).
- Alert preferences — names the project's on-call destination per dimension (some dimensions may page; others may just open a ticket).

**Populates**
- The baseline itself at every model deployment — values computed from the latest `eval-core run` against the harness, snapshotted, pushed to central baseline storage with the model identifier.
- ADRs justifying any baseline that exceeds the freshness window.

**Consumes via**
- `eval-core drift baseline push --model <id>` at deploy time.
- The comparator engine runs centrally on the declared cadence; project doesn't trigger it.
- Alerts arrive in the project's declared destinations.

---

## 5. interface_contract

**`eval/drift/config.yaml` schema**
```yaml
dimensions:
  - name: <string>
    metric: <string — e.g. auto_approve_rate, p95_latency_ms, grounding_score>
    baseline_ref: <model_id> | <baseline_storage_uri>
    threshold:
      type: absolute | relative
      direction: increase | decrease | either
      value: <float>
    cadence: hourly | daily | weekly | <cron>
    alert:
      destination: <pagerduty_service | slack_channel | email | ticket_queue>
      severity: page | warn | info
    baseline_freshness_days: <int>     # max age before ADR required
```

**Baseline push at deploy**
```bash
eval-core drift baseline push \
  --model <model_id> \
  --from-harness-run <run_id> \
  --dimensions <subset_or_all>
```

**Alert payload schema**
```json
{
  "workload": "string",
  "dimension": "string",
  "metric": "string",
  "baseline_value": "float",
  "current_value": "float",
  "delta": "float",
  "threshold_breached": "string",
  "cadence_window": "string",
  "model_id": "string",
  "drift_check_run_id": "string",
  "dashboard_url": "string"
}
```

**Baseline-update coupling gate (CI)**
Triggers on PRs that change any of: model identifier in `eval/config.yaml`, prompt files, training data references. Requires either: a corresponding `eval-core drift baseline push` line in the PR's deployment script, OR an ADR under `docs/adrs/` explicitly deferring baseline refresh with rationale and TTL.

**Versioning**
Drift schema follows `eval-core` semver. Baseline storage format is independently versioned; old baselines remain readable when the comparator engine bumps majors.

---

## 6. acceptance_criteria

Project architect self-attests. Comparator service logs, baseline storage entries, and CI logs are the mechanical evidence.

- [ ] `eval/drift/config.yaml` exists and validates against the central schema.
- [ ] Every dimension declared has a `metric`, `baseline_ref`, `threshold`, `cadence`, and `alert.destination`.
- [ ] A baseline has been pushed for the currently-deployed model identifier; the baseline storage URI in config resolves successfully.
- [ ] Baseline age is within `baseline_freshness_days`, OR an ADR exists in `docs/adrs/` justifying the stale baseline with explicit TTL.
- [ ] The drift comparator has run within the declared cadence window for every dimension (visible in the central drift dashboard).
- [ ] Baseline-update coupling lint (CI) is configured as a **required** status check on the integration branch via branch protection. Advisory runs do not satisfy this criterion.
- [ ] Latest baseline-update coupling lint exits 0 on the integration branch.
- [ ] No open drift alerts at `severity: page` are unresolved beyond their declared SLA.
