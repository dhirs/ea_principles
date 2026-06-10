# Reference Implementation — GS6B1-01

## 1. principle_id
GS6B1-01 — Never train a model on data no one has examined. Every workload with a training or customization path declares a purification manifest (policy-derived poison categories, per-category filter + threshold + on_flag action, audit destination), wires the purification stage ahead of the job (the job consumes only the stage's output, never a raw source), and writes a per-run audit record. The learning-side member of the Security guardrail family (input GS4B2-01 / retrieval GS1B3-01 / output GS2B1-01 / action GS5B1-01 / learning this). (Option A — declared-and-wired.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — regulated industries training on customer or claims data push toward yes; held at no-borderline parallel to the GS siblings).
- D2 (repeatability_cost): 3 — a central data-purification filter library (per-category implementations: bias, factual-incorrectness, hate/violence, irrelevance, anomalous-repetition/trigger heuristics), guardrail-engine adapters applied at the data layer, the purification-stage templates per orchestrator (SageMaker Pipelines / k8s / Slurm / managed vendor fine-tune APIs), the audit-record schema, the canary poison corpus, and the three lints. Weeks of platform/security engineering per project if rebuilt locally.
- audit_mode: self_attestation_with_mechanical_evidence — CI lint logs, per-run purification audit records, and the quarterly seeded-poison results are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `purification-sdk` — a pipeline-stage library exposing `purify(dataset_uri, manifest) -> purified_uri + audit_record`: runs the manifest's filters over the dataset, quarantines/drops/routes per `on_flag`, writes the audit record, and emits the purified output location the training job consumes.
- Per-category filter implementations — `purification_sdk.filters.bias`, `.factual`, `.hate_violence`, `.irrelevance`, `.anomalous_repetition` — plus a guardrail-engine adapter (`purification_sdk.adapters.guardrail`) applying GS2B1-01-style content categories at the data layer, and a plug-in interface for project-local validators.
- Purification manifest schema at `purification-schema/manifest.v1.yaml` — `categories` (each: `filter`, `threshold`, `on_flag`), `audit` destination, `waivers` (policy category + written reason).
- The three lints (declaration completeness; policy coverage against the org AI policy / data-card registry; source coupling — job configs must consume a purified-output location, raw-source references fail, dataset-version changes require a matching audit-record hash) + reusable CI workflow templates.
- Per-orchestrator stage templates — SageMaker Pipelines step, k8s init-job, Slurm prerequisite batch job, and a managed-API wrapper that gates the vendor fine-tune call on a completed purification run.
- Canary poison corpus — known-poisonous samples spanning the standard categories, versioned, run via GO1B1-01's harness for the quarterly seeded-poison audit.
- SDK version floor at `purification-schema/sdk_floor.txt`.

**Operates**
- Semver on the purification SDK; filter and adapter maintenance as engines evolve.
- Maintains the canary poison corpus and the catch-rate threshold; runs/coordinates the quarterly seeded-poison audit with security.
- Maintains the policy-category registry that the policy-coverage lint reads (the machine-readable projection of the org AI policy / data cards).

**Owns paths**
- `<platform-repo>/purification-sdk/` and `/filters/` and `/adapters/`.
- `<platform-repo>/purification-schema/` — manifest schema, sdk_floor, policy-category registry, canary corpus, CHANGELOG.
- `<platform-repo>/purification-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `training/purification/config.yaml` at repo root — the workload's categories (policy-derived + workload-specific), per-category `filter` / `threshold` / `on_flag`, the `audit` destination, and any `waivers`.
- Pins the purification SDK version (≥ floor).
- `.github/workflows/purification-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- The training/customization job config — points the job's data source at the purification stage's output location (never the raw bucket); for managed-API fine-tunes, routes the call through the gating wrapper.
- Workload-specific filters and thresholds (e.g. a relevance filter tuned to the model's intended domain; a trigger-phrase heuristic for vendor-supplied corpora).
- Quarantine review duty — a named owner works the `human_review` queue when `on_flag` routes there.

**Consumes via**
- `pip install purification-sdk` (or language equivalent); the per-orchestrator stage template for their pipeline.
- GitHub Actions: `uses: <org>/purification-workflows/.github/workflows/purification-check.yml@v1`.
- Quarterly seeded-poison audit: submit the workload's manifest and a test run to the central canary-corpus evaluation.

---

## 5. interface_contract

**Pipeline stage**
```python
result = purification_sdk.purify(
    dataset_uri="s3://corpus/reviews/2026-06-01/",
    manifest="training/purification/config.yaml",
)
# result.purified_uri  -> the ONLY location the training job may consume
# result.audit_record  -> written to the declared audit destination
#   { dataset_hash, filter_versions, per_category: { scanned, flagged, quarantined } }
```

**Purification manifest (`training/purification/config.yaml`)**
```yaml
categories:
  bias:                { filter: central.bias,                threshold: 0.85, on_flag: quarantine }
  factual_incorrectness: { filter: central.factual,           threshold: 0.80, on_flag: human_review }
  hate_violence:       { filter: central.guardrail_adapter,   threshold: 0.90, on_flag: drop }
  irrelevance:         { filter: local.domain_relevance,      threshold: 0.75, on_flag: quarantine }
  trigger_phrases:     { filter: central.anomalous_repetition, threshold: 0.95, on_flag: human_review }
audit:
  destination: training/purification/log.yaml
waivers: []
```

**Scope boundary** — the purification gate screens the training/customization corpus before the job. Post-training evaluation of the customized model (toxicity evals, regression vs golden datasets) is the GO1B1 family's concern; runtime input screening is GS4B2-01; retrieval-corpus access control is GS1B3-01. Training-environment isolation (network, IAM) is base-WAF Security discipline this RI depends on, not re-implements.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs, per-run audit records, and the quarterly seeded-poison report are the mechanical evidence.

- [ ] `training/purification/config.yaml` exists; every category declares a filter, threshold, and on_flag action; an audit destination is declared — gate 1 lint passes on the integration branch.
- [ ] Every policy-/data-card-required category is screened or carries a written waiver — gate 2 lint passes on the integration branch.
- [ ] Every training/customization job config consumes a purified-output location; no raw-source reference; dataset-version changes carry a matching audit-record hash — gate 3 lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly seeded-poison audit has been run; catch-rate meets the declared threshold; the category list matches the current AI policy; shortfalls are tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove filters are declared, policy-covered, wired ahead of the job, and logged — the plumbing. They cannot prove a filter actually catches poison; a vacuous filter passes the build. That is the filters' runtime recall, which is why the quarterly seeded-poison audit is a binding acceptance criterion, not an optional extra.
