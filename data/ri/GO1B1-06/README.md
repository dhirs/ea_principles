# Reference Implementation — GO1B1-06

## 1. principle_id
GO1B1-06 — Pin every model call to an immutable, catalogued version and re-run the evaluation harness before any version change ships. Pinning + approved-model-catalog membership makes a model change detectable and reviewable; the re-eval-on-change gate makes it impossible to ship a model swap that has not cleared the workload's baseline. Catches the discrete model-substitution failure that per-PR gates (no PR fires) and the GO1B1-04 drift monitor (a clean step-change can land inside one window) both miss.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — borderline yes in regulated industries where Model Risk Management regimes (e.g. SR 11-7 in banking) require validation before a model change reaches production. Workloads in those industries should treat this as mandatory_centralise.
- D2 (repeatability_cost): 3 — approved model catalog, catalog-membership lint, a model SDK that refuses un-pinned calls at runtime, the re-eval-on-change gate wiring into GO1B1-01, and rollback tooling are substantial platform engineering that would repeat as weeks per project if built locally.

Validation stays project-architect self-attestation against the central tooling; CI logs and the eval-harness run are the mechanical evidence. Same shape as GO1B1-04 and GO3B1-01 — the enterprise tier is about who builds the catalog and lints, not who clicks a URL.

---

## 3. central_team

**Builds**
- Approved model catalog (`models/catalog.yaml` schema + the platform-owned source it points to) — one entry per approved model, each an exact immutable version (a dated provider snapshot like `provider:model:2026-05-01`, or a self-hosted weights digest), never an alias. Carries per-entry metadata: provider, exact version, status (`approved` / `deprecated` / `withdrawn`), and an optional successor pointer for migration.
- Catalog-membership lint — scans the workload (config, `src/`, env-var defaults) for every model reference and fails the PR unless each resolves to a catalog entry; rejects floating aliases (`-latest`, `default`) and un-catalogued identifiers.
- Model SDK with runtime refusal — the central model client resolves a model reference against the catalog at call time and refuses to invoke a model that is not a catalogued pinned version, closing the dynamically-resolved-alias hole the static lint cannot see (the GO3B1-01 SDK pattern applied to model identifiers).
- Re-eval-on-change gate — detects a changed pinned model identifier (diff vs merge base) and requires the workload's GO1B1-01 eval harness to re-run against the new version and clear its baseline before the PR can merge.
- Deprecation feed — when a provider deprecates a snapshot, the catalog entry flips to `deprecated` with a successor; a lint warns workloads pinned to a deprecating version so the migration is a deliberate, evaluated PR rather than a forced auto-swap.

**Operates**
- Semver on the catalog schema and lints; migration guides on schema bumps.
- Maintains the catalog against provider release/deprecation notes — the most expensive ongoing item; new approved snapshots are added after a baseline eval, deprecations flagged within one week of the provider notice.
- On-call for the model SDK / catalog service when it blocks multiple projects.

**Owns paths**
- `<platform-repo>/model-catalog/` — catalog source, schema, validator.
- `<platform-repo>/model-sdk/` — the runtime-refusing model client + catalog resolver.
- `<platform-repo>/model-catalog/lints/` — catalog-membership lint, re-eval-on-change gate, deprecation-warning lint.

---

## 4. project_team

**Configures**
- `models/catalog.yaml` reference (or the pinned subset of the central catalog the workload is approved to use) — declares the exact catalogued model version(s) this workload pins.
- Branch protection — wires the catalog-membership lint and the re-eval-on-change gate as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).
- `pyproject.toml` / `package.json` dependency on the central model SDK, pinned at a version that enforces catalog resolution.

**Populates**
- Workload code — every model call routes through the central model SDK with a catalogued pinned identifier. No floating aliases, no env-default model names, no direct provider-SDK calls with raw model strings.
- A re-eval result whenever the pinned model identifier changes — the GO1B1-01 harness run against the new version, passing the baseline (or a `docs/adrs/` ADR justifying an exception).

**Consumes via**
- The central catalog-membership lint and re-eval gate run on every PR (reusable CI workflow).
- The model SDK resolves and enforces catalog membership at runtime.
- Deprecation warnings arrive when a pinned version is flagged for retirement.

---

## 5. interface_contract

**Model catalog entry schema** (`models/catalog.yaml`)
```yaml
models:
  - id: claims-sonnet                 # workload-facing handle
    provider: anthropic | openai | bedrock | azure | self_hosted
    version: <exact immutable id>     # e.g. "claude-sonnet-4-6@2026-05-01" or a weights digest sha256:...
    status: approved | deprecated | withdrawn
    successor: <id> | null            # set when deprecated, to steer migration
    approved_baseline_run: <harness_run_id>   # the GO1B1-01 run that cleared this version
```

**Catalog-membership lint** (pre_merge, blocking)
On any PR, for every model reference found in config, `src/`, and env-var defaults:
```
resolve(reference) MUST be a models/catalog.yaml entry with status != withdrawn
FAIL if reference is a floating alias (-latest, default, undated pointer)
FAIL if reference is not present in the catalog
```

**Re-eval-on-change gate** (pre_merge, blocking)
```
changed = diff(pinned model identifiers, merge_base)
if changed is non-empty:
    REQUIRE a GO1B1-01 harness run against the new identifier in this PR
    FAIL if no run for the new identifier
    FAIL if the run did not clear the declared baseline
    UNLESS a docs/adrs/ ADR justifies the exception (with TTL)
```

**Runtime SDK refusal**
```python
model_sdk.generate(model="claims-sonnet", ...)   # resolves to a catalog entry
# raises UnpinnedModelError if the resolved id is an alias or absent from the catalog
```

**Rollback**
Revert the one line pinning the model identifier back to the prior catalogued version; because every version is immutable and catalogued, the previous behaviour is exactly restored.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs and the GO1B1-01 harness run are the mechanical evidence.

- [ ] Every model reference in the workload (config, `src/`, env defaults) resolves to an exact, catalogued, immutable version — no floating aliases, no un-catalogued identifiers. Catalog-membership lint passes on the integration branch.
- [ ] Every model call routes through the central model SDK; no direct provider-SDK call uses a raw/aliased model string.
- [ ] The current pinned model identifier has a passing GO1B1-01 baseline run on record (`approved_baseline_run`).
- [ ] Any PR that changed the pinned model identifier re-ran the GO1B1-01 harness against the new version and cleared the baseline — re-eval-on-change gate passes — or carries an ADR justifying the exception with a TTL.
- [ ] Both gates are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.
- [ ] No model reference is pinned to a `withdrawn` catalog entry; any `deprecated` pin has a tracked migration to its successor.
