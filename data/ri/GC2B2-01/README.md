# Reference Implementation — GC2B2-01

## 1. principle_id
GC2B2-01 — Size AI infrastructure to real demand, not to the safe maximum. Applies only to workloads that self-host a foundation model or run on committed managed capacity (Bedrock Provisioned Throughput and equivalents); pure pay-per-token API workloads have no infrastructure to right-size.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no.
- D2 (repeatability_cost): 3 — IaC-vs-config consistency lint (Terraform / CloudFormation / Kubernetes / docker-compose parsing), deployed-alarm verification against cloud monitoring APIs, baseline-against-actual reconciliation are weeks of platform-team engineering per cloud and per workload if local.

---

## 3. central_team

**Builds**
- Right-sizing config schema + validator — defines the shape of `infra/right-sizing/config.yaml` (GPU/CPU/memory targets, instance ceilings, scheduling windows, reserved-capacity coverage targets, model identifier, quantization precision).
- Utilization-alarms schema + validator — defines `infra/monitoring/utilization-alarms.yaml` (metric, threshold, evaluation window, alert routing).
- Multi-cloud IaC parser — reads Terraform, CloudFormation, Kubernetes manifests, docker-compose, AWS CDK output, and Pulumi state; extracts the deployed infrastructure shape (instance type, count, model identifier, quantization).
- Code-vs-record consistency lint — compares the declared YAML against the parsed IaC; fails the PR if mismatch is present without an accompanying ADR.
- Cloud-monitoring-API verifier — queries CloudWatch / Prometheus / Azure Monitor / Stackdriver to confirm every alarm declared in the YAML is actually deployed and active.
- Templates for common workload shapes (single-endpoint inference, batch inference, fine-tuning workload, RAG index plus model).
- Cross-project right-sizing dashboard — surfaces utilization-vs-target per workload, reserved-capacity coverage, quantization-eligibility flags.

**Operates**
- Semver on the schemas; migration guides on IaC-parser bumps when new cloud-provider primitives ship.
- Maintains the IaC parser across cloud vendors and IaC tools (the most expensive ongoing item — parsers drift as vendors evolve).
- Maintains the cloud-monitoring-API integrations.
- On-call when the verifier hits cloud-API rate limits or auth failures across projects.

**Owns paths**
- `<platform-repo>/eval-core/infra/` — schemas, validators, IaC parser, consistency lint, alarm verifier.
- `<platform-repo>/eval-core/infra/templates/` — workload-shape templates.
- `<platform-repo>/right-sizing-dashboard/` — cross-project surface.

---

## 4. project_team

**Configures**
- `infra/right-sizing/config.yaml` — declares the workload's right-sizing baseline: GPU type and count ceiling, target utilization band per resource, scheduling windows, reserved-capacity coverage target as a function of workload age, model identifier, quantization precision, quantization-review cadence.
- `infra/monitoring/utilization-alarms.yaml` — declares the workload's utilization alarms: at minimum a `gpu_compute_oversized` alarm, an `idle_shutdown_violated` alarm, and a `quantization_review_overdue` alarm. Alert routing per alarm.

**Populates**
- The actual IaC (Terraform/CloudFormation/k8s/docker-compose/Pulumi) that deploys infrastructure matching the declared baseline.
- ADRs under `docs/adrs/` justifying any temporary divergence between declared baseline and deployed IaC.

**Consumes via**
- The central consistency lint runs on every PR touching `infra/`.
- The central alarm verifier runs on a cadence post-deploy and surfaces missing/inactive alarms.
- Cloud-API credentials for the verifier are provided by the platform team via the central monitoring identity.

---

## 5. interface_contract

**`infra/right-sizing/config.yaml` schema**
```yaml
resources:
  gpu:
    type: <e.g. A100, H100, L40S, ml.g5.12xlarge>
    count: <int>
    ceiling: <int>                            # max instances under autoscaling
utilization_targets:
  compute:
    band_low: <float, 0-1>
    band_high: <float, 0-1>
  memory:
    band_low: <float, 0-1>
    band_high: <float, 0-1>
scheduling:
  active_windows: <list of cron/window expressions>
  idle_policy:
    auto_suspend_after_idle: <duration>
    full_shutdown_after_idle: <duration>
  weekly_max_active_hours: <int>
model:
  identifier: <vendor:model:version>
  precision: <FP32 | FP16 | BF16 | INT8 | INT4>
  precision_review_due: <ISO 8601>
reserved_capacity:
  coverage_target_as_workload_age:
    < 6_months: 0
    6_to_12_months: 0.5
    > 12_months: 0.8
```

**`infra/monitoring/utilization-alarms.yaml` schema**
```yaml
alarms:
  - name: <string>
    resource: gpu | cpu | memory | scheduling | quantization_review | ri_coverage
    metric: <metric_name>
    threshold:
      value: <float>
      direction: above | below
    evaluation_window: <duration>
    alert:
      destination: <pagerduty_service | slack_channel | ticket_queue>
      severity: page | warn | info
```

**Required minimum alarms** (consistency lint fails if missing):
- `gpu_compute_oversized` — fires when GPU utilization stays below `utilization_targets.compute.band_low` for the evaluation window.
- `idle_shutdown_violated` — fires when scheduled shutdown windows are not honoured.
- `quantization_review_overdue` — fires when `precision_review_due` has passed.

**Code-vs-record consistency lint**
On any PR touching `infra/` or model references:
- Parses the workload's IaC.
- Verifies actual GPU instance count ≤ `resources.gpu.ceiling`.
- Verifies actual GPU type equals `resources.gpu.type`.
- Verifies actual served model identifier equals `model.identifier`.
- Verifies actual quantization precision equals `model.precision`.
- Verifies every alarm in `utilization-alarms.yaml` exists in IaC AND is deployed (via cloud-monitoring API call).
- Fails PR on mismatch without an accompanying ADR.

---

## 6. acceptance_criteria

- [ ] `infra/right-sizing/config.yaml` exists and validates against the central schema.
- [ ] `infra/monitoring/utilization-alarms.yaml` exists, validates, and includes the three required minimum alarms.
- [ ] Workload's serving paradigm is `self_hosted_managed`, `self_hosted_unmanaged`, or `api_provisioned` (otherwise GC2B2-01 does not apply).
- [ ] Code-vs-record consistency lint exits 0 — declared baseline matches deployed IaC, or every mismatch is justified by an ADR with explicit TTL.
- [ ] Every alarm declared in `utilization-alarms.yaml` is confirmed deployed and active by the central alarm verifier (visible on the right-sizing dashboard).
- [ ] `quantization_review_overdue` alarm has not fired (or has fired and been resolved within SLA) — the precision_review_due date in config is in the future.
- [ ] For workloads older than 6 months, the reserved-capacity coverage target is being honoured, or an ADR justifies the gap.
- [ ] Consistency lint is configured as a **required** status check on the integration branch via branch protection.
