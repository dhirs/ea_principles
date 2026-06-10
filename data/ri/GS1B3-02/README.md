# Reference Implementation — GS1B3-02

## 1. principle_id
GS1B3-02 — Never ingest what the model should never process. Every workload ingesting into a model-accessible store declares a sanitisation manifest (data-card-derived exclusion classes, per-class detector + action + threshold, audit destination), wires the sanitisation stage ahead of the store on every ingestion path (writes only through the central ingestion SDK), and leaves a per-run audit record. Write-path sibling of GS1B3-01 (read gate); RAG-corpus twin of GS6B1-01 (training corpus). (Option A — declared-and-wired.)

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — PII handling under privacy regulation pushes toward yes; held at no-borderline parallel to the GS siblings).
- D2 (repeatability_cost): 3 — a central detector library (PII classes, prohibited material, out-of-remit classifiers), guardrail-engine adapters at the data layer, the ingestion SDK write path with embedded sanitisation, the routed-ingestion AST lint, the canary PII corpus, and the audit-record schema. Weeks of platform/security engineering per project if rebuilt locally.
- audit_mode: self_attestation_with_mechanical_evidence — CI lint logs, per-run sanitisation audit records, and the quarterly seeded-PII results are the mechanical evidence; validator project_architect, arb_role dashboard_and_spot_check.

---

## 3. central_team

**Builds**
- `ingestion-sdk` — the write-side sibling of GS1B3-01's retrieval SDK: `ingest(docs, manifest) -> store_write + audit_record`. Runs the manifest's detectors before embedding (mask / drop / route per class), then applies GS1B3-01's ACL labelling, then writes to the store. No other write path exists.
- Detector library — `ingestion_sdk.detectors.pii` (names, contact details, identifiers, financial/health data), `.credentials` (keys, tokens, passwords in text or code), `.prohibited`, plus a guardrail-engine adapter and a plug-in interface for project-local detectors (e.g. out-of-remit classifiers).
- Sanitisation manifest schema at `sanitisation-schema/manifest.v1.yaml` — `exclusions` (each: `detector`, `action`, `threshold`), `audit` destination, `waivers` (data-card class + written reason).
- The three lints (declaration completeness; data-card coverage against the policy/data-card registry; routed ingestion — AST lint forbidding store writes outside the SDK, plus audit-record requirement on corpus-source changes) + reusable CI workflow templates.
- Canary PII corpus — documents with planted sensitive content spanning the standard classes, versioned, run via GO1B1-01's harness for the quarterly seeded-PII audit.
- SDK version floor at `sanitisation-schema/sdk_floor.txt`.

**Operates**
- Semver on the ingestion SDK; detector and adapter maintenance.
- Maintains the canary PII corpus and the leak-rate threshold; runs/coordinates the quarterly seeded-PII audit with security and the DPO.
- Maintains the data-card / policy registry the coverage lint reads.

**Owns paths**
- `<platform-repo>/ingestion-sdk/` and `/detectors/` and `/adapters/`.
- `<platform-repo>/sanitisation-schema/` — manifest schema, sdk_floor, data-card registry, canary corpus, CHANGELOG.
- `<platform-repo>/sanitisation-workflows/` — reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `ingestion/sanitisation/config.yaml` at repo root — the workload's exclusion classes (data-card-derived + workload-specific), per-class `detector` / `action` / `threshold`, the `audit` destination, any `waivers`.
- Pins the ingestion SDK version (≥ floor).
- `.github/workflows/sanitisation-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three pre-merge lints as **required** status checks on the integration branch.

**Populates**
- Every ingestion path — batch builds, nightly syncs, event-driven ingestion — routed through `ingestion_sdk.ingest(...)`; never a direct store write.
- Workload-specific detectors and the out-of-remit definition (e.g. a customer-service corpus excludes financials, staff records, HR policies — the AWS step-3 example).
- Review duty — a named owner works the `human_review` queue when an action routes there.

**Consumes via**
- `pip install ingestion-sdk` (or language equivalent).
- GitHub Actions: `uses: <org>/sanitisation-workflows/.github/workflows/sanitisation-check.yml@v1`.
- Quarterly seeded-PII audit: submit the workload's manifest and a test ingestion to the central canary-corpus evaluation.

---

## 5. interface_contract

**Ingestion call**
```python
result = ingestion_sdk.ingest(
    source_uri="s3://exports/support-docs/2026-06-01/",
    manifest="ingestion/sanitisation/config.yaml",
)
# Detectors run BEFORE embedding; then ACL labelling (GS1B3-01); then the store write.
# result.audit_record -> { source_version, detector_versions,
#                          per_class: { scanned, masked, dropped, routed } }
```

**Sanitisation manifest (`ingestion/sanitisation/config.yaml`)**
```yaml
exclusions:
  pii_identity:    { detector: central.pii,          action: mask,         threshold: 0.85 }
  pii_financial:   { detector: central.pii_financial, action: drop,        threshold: 0.85 }
  credentials:     { detector: central.credentials,  action: drop,         threshold: 0.95 }
  out_of_remit:    { detector: local.remit_classifier, action: human_review, threshold: 0.75 }
audit:
  destination: ingestion/sanitisation/log.yaml
waivers: []
```

**Scope boundary** — this stage decides what may be stored at all and runs BEFORE GS1B3-01's ACL labelling (first whether, then who). Per-query retrieval authorization is GS1B3-01; training-corpus screening is GS6B1-01; output-side PII filtering is GS2B1-01's backstop, not a substitute.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs, per-run audit records, and the quarterly seeded-PII report are the mechanical evidence.

- [ ] `ingestion/sanitisation/config.yaml` exists; every exclusion class declares a detector, action, and threshold; an audit destination is declared — gate 1 lint passes on the integration branch.
- [ ] Every data-card-prohibited class is screened or carries a written waiver — gate 2 lint passes on the integration branch.
- [ ] No code writes to the vector store except through the ingestion SDK; corpus-source changes carry a matching audit record — gate 3 AST lint passes on the integration branch.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection.
- [ ] The quarterly seeded-PII audit has been run; leak-rate meets the declared threshold; the exclusion list matches the current data card; shortfalls are tracked to closure.

> **Enforcement boundary (read `data/enforcement_limits.md`):** the lints prove the sanitisation stage is declared, covered, wired on every ingestion path, and logged — the plumbing. They cannot prove a detector actually catches a given piece of PII; that is its runtime recall, which is why the quarterly seeded-PII audit is a binding acceptance criterion, not an optional extra.
