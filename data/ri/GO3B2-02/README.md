# Reference Implementation — GO3B2-02

## 1. principle_id
GO3B2-02 — Traces can hold sensitive data, so govern who reads them and how long they live. Sibling to GO3B2-01: GO3B2-01 owns the write path (emission, header enrichment, PII pre-scrub); GO3B2-02 owns the read path (access policy keyed on `compliance_tier`, retention enforced via backend lifecycle rules, read-side audit logs).

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — read-side governance on already-PII-scrubbed traces is one step removed from the raw-PII exposure that GO3B2-01's emit-time scrub addresses. A regulated-industry adopter may push D1 to yes locally; the catalogue default mirrors the GO3B2-01 hedge).
- D2 (repeatability_cost): 3 — access policy schema, retention policy with backend-specific lifecycle rule generation across 3–4 backends, IaC bypass lint, read-audit pipeline, central security review workflow with 1-week SLA. Weeks of platform/security engineering per project if left local, plus continuous policy maintenance.

---

## 3. central_team

**Builds**
- `observability/access_policy.yaml` — schema and source of truth for principal-to-`compliance_tier` authorisation. Per project, per region, per role. Owned by the platform security team.
- `observability/retention_policy.yaml` — map of `compliance_tier` → maximum retention window (e.g. `regulated: 30d`, `sensitive: 90d`, `standard: 13mo`). Owned by the platform security team in coordination with privacy.
- `observability/iam_managed_by_central.yaml` — allow-list of observability backend ARNs and API tokens that the central policy manages. Source of truth for gate 2 (no project-local IAM grants).
- `observability/policy_floor.txt` — minimum central policy package version. Source of truth for gate 3.
- IaC modules that translate `retention_policy.yaml` into backend-specific lifecycle rules (S3 lifecycle, Datadog retention API calls, Langsmith TTL config, CloudWatch log-group `retention_in_days`).
- Read-audit pipeline — backend-side access logs (S3 access logs, Datadog audit log API, Langsmith audit log API) shipped into a central queue, deduplicated, indexed by `trace_id` + `principal` + `compliance_tier`.
- Lint plugins for the three pre_merge gates (compliance_tier presence + registry match; IaC bypass scan; policy version floor).
- Backend access addition workflow — intake form, review checklist (data residency, principal scope, expected access volume, expiry), **1-week SLA** to approval / rejection / conditional.
- Compliance_tier reclassification workflow — intake form, review checklist (workload data classification change, retention impact, downstream notification), **1-week SLA**.
- Incident-response role profiles — pre-declared in `access_policy.yaml`, scoped to active-incident `trace_id` families. Activation requires a security-team approval recorded in the read-audit stream.
- `CHANGELOG.md` + announcement template for each policy schema rev.

**Operates**
- Semver on the central policy package; N-1 major-version support window. Schema-deprecation cycle mirrors GO3B2-01's 6-month window.
- Policy file PRs go through the security team's review queue. Quarterly review of `access_policy.yaml` principals against HR / contractor systems to surface drift.
- Lifecycle rules drift from `retention_policy.yaml` — automated reconciliation runs daily, flags backends whose effective retention differs from the declared policy.
- Read-audit pipeline on-call rotation — owns ingest health, indexing latency, query SLA for incident response.
- Quarterly audit of regulated-tier reads — security team samples N reads, confirms each had a documented business need and was made by an authorised principal.
- Backend access addition queue with 1-week SLA. Compliance_tier reclassification queue with 1-week SLA.
- Annual review of incident-response role profiles in the access policy — confirm SRE on-call principals are current, scope rules still match incident-management runbook.

**Owns paths**
- `<platform-repo>/observability-policy/access_policy.yaml`
- `<platform-repo>/observability-policy/retention_policy.yaml`
- `<platform-repo>/observability-policy/iam_managed_by_central.yaml`
- `<platform-repo>/observability-policy/policy_floor.txt`
- `<platform-repo>/observability-policy/lifecycle_iac/` — IaC modules per backend.
- `<platform-repo>/observability-policy/read_audit_pipeline/` — ingest, dedupe, indexer.
- `<platform-repo>/observability-policy/lint/` — three lint plugins for the gates.
- `<platform-repo>/observability-policy/docs/backend_access_request.md` — intake form.
- `<platform-repo>/observability-policy/docs/compliance_tier_reclassification.md` — intake form.

---

## 4. project_team

**Configures**
- `observability/config.yaml` at workload repo root — declare `compliance_tier` ∈ {regulated, sensitive, standard}. Same file GO3B2-01 already requires; this adds one field. Must match the workload's tier in the central project registry.
- Workload IaC — does NOT include IAM grants on observability backend resources. Any read access the team needs flows through the central `access_policy.yaml`.
- `.github/workflows/observability-policy-lint.yml` — calls the central reusable lint workflow for the three policy gates.
- Branch protection — wires the three policy lint checks as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).

**Populates**
- Workload-level `compliance_tier` in `observability/config.yaml` — value derived from the data the workload processes (regulated for HIPAA / PCI / regulated-industry, sensitive for internal-confidential or PII-handling, standard otherwise). Initial value reviewed once at workload onboarding through the compliance_tier intake form.

**Consumes via**
- The pinned central observability policy package (`pip install observability-policy>=<floor>` or language equivalent). The package ships the lint plugins, the schema validators, and the access-test client used in CI.
- GitHub Actions: `uses: <org>/observability-policy/.github/workflows/policy-lint.yml@v1`.
- Backend access additions: submit `<platform-repo>/observability-policy/docs/backend_access_request.md` — 1-week SLA.
- Compliance_tier reclassifications: submit `<platform-repo>/observability-policy/docs/compliance_tier_reclassification.md` — 1-week SLA.
- Incident-response role activations: SRE on-call requests via security team's incident channel; activation is logged in the read-audit stream automatically.

---

## 5. interface_contract

**`observability/config.yaml` extension** (project-owned)
```yaml
# Existing fields from GO3B2-01
project_id: payments-fraud-agent
default_target_backend: langsmith
workload_pattern: agent
sdk_version: ">=2.4.0"
policy_version: ">=1.1.0"

# New field for GO3B2-02
compliance_tier: regulated   # one of: regulated | sensitive | standard
                              # must match the value declared in the central project registry
```

**`observability/access_policy.yaml`** (central-owned, single source of truth)
```yaml
schema_version: 1.1
principals:
  - id: role:sre-oncall
    type: role
    grants:
      - compliance_tier: [regulated, sensitive, standard]
        projects: ["*"]
        regions: ["us-east", "eu-west"]
        scope: incident_response
        activation: required           # must be activated against an incident
        max_window_hours: 24
  - id: group:platform-observability
    type: group
    grants:
      - compliance_tier: [standard]
        projects: ["*"]
        regions: ["*"]
        scope: continuous
  - id: group:fraud-team-leads
    type: group
    grants:
      - compliance_tier: [regulated, sensitive, standard]
        projects: ["payments-fraud-agent", "payments-fraud-rag"]
        regions: ["us-east"]
        scope: continuous
  - id: user:alice@example.com
    type: user
    grants:
      - compliance_tier: [sensitive, standard]
        projects: ["payments-fraud-agent"]
        regions: ["us-east"]
        scope: continuous
        expires: "2026-12-31"
```

**`observability/retention_policy.yaml`** (central-owned)
```yaml
schema_version: 1.0
retention_by_tier:
  regulated:
    max_window: 30d
    deletion_on_dsar: true            # triggered by DSAR pipeline
    backend_overrides:
      cloudwatch:    30d
      langsmith:     30d
      datadog:       30d
      s3_archive:    30d
  sensitive:
    max_window: 90d
    deletion_on_dsar: true
  standard:
    max_window: 13mo
    deletion_on_dsar: false
```

**`observability/iam_managed_by_central.yaml`** (central-owned allow-list — source of truth for gate 2)
```yaml
schema_version: 1.0
managed_resources:
  - arn_pattern: "arn:aws:s3:::observability-*"
  - arn_pattern: "arn:aws:logs:*:*:log-group:/aws/observability/*"
  - arn_pattern: "arn:aws:iam::*:role/observability-read-*"
managed_api_scopes:
  datadog:   ["logs_read", "apm_read", "llm_obs_read"]
  langsmith: ["projects:read", "runs:read", "datasets:read"]
  langfuse:  ["traces:read", "observations:read"]
```

**Lint outputs**

Gate 1 lint (compliance_tier presence + registry match):
```
PASS: observability/config.yaml declares compliance_tier=regulated; registry confirms.
FAIL: observability/config.yaml missing compliance_tier field.
FAIL: observability/config.yaml declares compliance_tier=standard but registry declares regulated for this workload.
```

Gate 2 lint (IaC bypass scan):
```
PASS: no project-local IAM grants on observability backend resources.
FAIL: terraform/iam.tf line 42 — aws_iam_policy.observability_read grants s3:GetObject on
       arn:aws:s3:::observability-prod, which is on the central allow-list. Submit a backend
       access request via observability-policy/docs/backend_access_request.md.
```

Gate 3 lint (policy version floor):
```
PASS: pinned observability-policy version 1.1.2 ≥ floor 1.1.0.
FAIL: pinned observability-policy version 1.0.5 < floor 1.1.0. Bump pin to ≥ 1.1.0.
```

**SLAs**
- Backend access additions: reviewed within 1 week. Outcomes: approved (added to access policy + IaC lifecycle module updated), rejected with reason, conditional (e.g. time-boxed, region-restricted, scope-restricted).
- Compliance_tier reclassification: reviewed within 1 week. Outcomes: approved (tier updated in registry + central policy re-applied + retention recomputed), rejected with reason.
- Incident-response role activation: minutes (security team on-call approves via incident channel; activation logs into read-audit stream).

**Versioning**
- Central policy package follows semver. Projects pin major version. N-1 supported.
- Schema deprecation: 6-month window. CHANGELOG + announcement + mid-window reminder + cutover.
- `policy_floor.txt` bumps at each cutover. Gate 3 fires when a workload pins below the floor.

---

## 6. acceptance_criteria

Project architect self-attests by confirming every item below is true. CI lint logs and the read-audit stream are the mechanical evidence.

- [ ] `observability/config.yaml` declares `compliance_tier ∈ {regulated, sensitive, standard}`, and the declared value matches the workload's entry in the central project registry.
- [ ] Pinned central observability policy package version ≥ floor declared in `observability/policy_floor.txt`.
- [ ] Workload IaC contains no direct IAM grants on observability backend resources — gate 2 lint passes on the integration branch.
- [ ] All three policy gate lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.
- [ ] Read access the workload's team needs (continuous or incident-response) is recorded in `<platform-repo>/observability-policy/access_policy.yaml`, not via local IAM. New access additions have gone through the backend access request workflow with documented outcome.
- [ ] No principal in the central access policy for this workload is over-scoped (e.g. an individual user grant where a group would suffice; a continuous grant where an incident-response activation would suffice).
- [ ] If the workload's `compliance_tier` has changed since onboarding, the change went through the compliance_tier reclassification workflow with documented outcome.
- [ ] The workload's traces are visible in the read-audit stream when reads occur — verified by a one-time test read after onboarding.
