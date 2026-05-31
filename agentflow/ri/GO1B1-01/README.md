# Reference Implementation — GO1B1-01

## 1. principle_id
GO1B1-01 — Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no
- D2 (repeatability_cost): 3 — runner, diff tool, CI template, manifest validator, scenario-schema validator all repeat as weeks of platform engineering per project if local.

---

## 3. central_team

**Builds**
- `eval-core` library — runner, grading engine, scenario loader, adapter dispatcher. Published as a versioned package.
- CLI commands: `eval-core run`, `eval-core diff`, `eval-core report`.
- `manifest.yaml` schema + validator (workload routing — pattern, code_path, eval_path per sub-workload).
- Scenario file JSON schema + validator (input + expected_decision + expected_evidence_trace).
- CI workflow templates (GitHub Actions / GitLab CI / Buildkite — reusable workflow files).
- Central adversarial scenario library at `eval-core/scenarios/adversarial/` for projects to import IDs from.
- Cross-project results dashboard ingesting `eval-core report` output.

**Operates**
- Semver on `eval-core`; N-1 major-version support window; migration guides on breaking changes.
- Patches, security fixes, schema evolutions; quarterly review of central adversarial library.
- On-call rotation for CI breakage that hits multiple projects.
- Dashboard uptime + ingestion pipeline.

**Owns paths**
- `<platform-repo>/eval-core/` — library + CLI + schemas.
- `<platform-repo>/eval-workflows/` — published reusable CI workflows.
- `<platform-repo>/eval-core/scenarios/adversarial/` — shared adversarial inventory.

---

## 4. project_team

**Configures**
- `manifest.yaml` at repo root declaring workloads with pattern, code_path, eval_path.
- `eval/config.yaml` — adapter reference, environment, timeouts.
- `eval/adapter.py` — project-specific glue calling the agent runtime (in-process / Lambda / Step Function — project's choice).
- `.github/workflows/eval.yml` — calls the central reusable workflow.
- Branch protection — wires the CI check as a **required** status check on the integration branch.

**Populates**
- `eval/scenarios/*.json` — labelled scenarios (≥10 to bootstrap, grow with every customer-reported regression).
- `eval/data/` — supporting data and mocks.

**Consumes via**
- `pip install eval-core` (or equivalent package manager).
- GitHub Actions: `uses: <org>/eval-workflows/.github/workflows/eval.yml@v1`.
- Scenario authors may reference central adversarial-library IDs in scenario `tags` to satisfy minimum-adversarial-coverage gates.

---

## 5. interface_contract

**Adapter function signature**
```python
def run_scenario(input_payload: dict) -> dict:
    return {
        "decision": {...},
        "evidence_trace": [...],
        "raw_output": {...}
    }
```

**`manifest.yaml` schema**
```yaml
workloads:
  - name: <string>
    pattern: agentic | rag | llm_only | ml
    code_path: <repo-relative path>
    eval_path: <repo-relative path>
```

**Scenario file schema**
```json
{
  "scenario_id": "string",
  "tags": ["string"],
  "input": {...},
  "expected_decision": { "action": "string", "acceptable_alternatives": ["string"] },
  "expected_evidence_trace": {
    "must_consult": ["string"],
    "must_apply_rules": ["string"],
    "must_not_invoke": ["string"]
  }
}
```

**Runner config schema (`eval/config.yaml`)**
```yaml
adapter: <import_path>:<function>
environment: in_process | staging | <named>
timeout_seconds: <int>
```

**Versioning**
- `eval-core` follows semver. Projects pin major version. N-1 supported.

**Grading**
- Decision match: `decision.action` equals `expected_decision.action` or is in `acceptable_alternatives`.
- Evidence trace: each entry in `must_consult` and `must_apply_rules` appears in agent's `evidence_trace`; no entry in `must_not_invoke` appears.

---

## 6. acceptance_criteria

Project architect self-attests by confirming every item below is true. CI logs are the mechanical evidence.

- [ ] `manifest.yaml` exists at repo root and validates against the central schema.
- [ ] At least one sub-workload in the manifest declares `pattern: agentic` (otherwise GO1B1-01 does not apply).
- [ ] `eval/scenarios/` for the agentic sub-workload contains ≥10 scenario files; each validates against the scenario schema.
- [ ] `eval/adapter.py` (or equivalent) exists and is referenced by `eval/config.yaml`.
- [ ] `.github/workflows/eval.yml` (or equivalent) exists and invokes the central `eval-core run`.
- [ ] CI job is configured as a **required** status check on the integration branch via branch protection. Advisory runs do not satisfy this criterion.
- [ ] Latest `eval-core run` on the integration branch exits 0.
