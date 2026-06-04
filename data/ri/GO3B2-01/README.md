# Reference Implementation — GO3B2-01

## 1. principle_id
GO3B2-01 — Centralised Observability SDK for AI Workloads. All model calls, tool invocations, and retrieval queries emit through a single enterprise SDK with a central-owned header and a project-owned payload; direct calls to observability backends are prohibited.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — PII redaction and EU data-residency hedges would push D1 to yes for regulated workloads).
- D2 (repeatability_cost): 3 — SDK across 3–4 languages, canonical schema and adapter set, price table maintenance, PII pre-scrub library, project-registry lookup, async non-blocking pipeline. Weeks of platform engineering per project if local, plus continuous maintenance.

---

## 3. central_team

**Builds**
- `observability-sdk` library (Python first; TypeScript and Java to follow) — `emit()` entry point, header enrichment, async non-blocking pipeline, PII pre-scrub.
- Backend adapters as separate plugin modules — `observability_sdk.adapters.langsmith`, `.datadog`, `.langfuse`, `.cloudwatch`. Each adapter maps the canonical event to the backend's native shape (Langsmith `runs`, Datadog LLM Observability spans, etc.).
- Canonical event schema at `observability-schema/schema.v1.yaml` — header field list (local-supplied + central-enriched), payload contract, pattern-specific sub-schemas for `rag` / `llm` / `agent` / `ml`.
- Price table at `observability-schema/price_table.yaml` — `model_id` → input/output cost per token. Updated when providers re-price.
- Allow-list at `observability-schema/allowed_imports.yaml` — permitted observability-related imports. Source of truth for gate 1 (direct-backend-call ban).
- SDK version floor at `observability-schema/sdk_floor.txt` — the minimum SDK version below which deprecated schemas would be in use. Source of truth for gate 3.
- Lint plugins for the three pre_merge gates (direct-backend ban, mandatory-headers check, version-floor check).
- CI workflow templates (GitHub Actions / GitLab CI / Buildkite — reusable workflow files).
- `CHANGELOG.md` + announcement template for each schema rev (email + Slack #observability-announce).
- Backend approval workflow — intake form, review checklist (data residency, PII pre-scrub compatibility, vendor contract, retention policy), **1-week SLA** to approval / rejection / conditional.

**Operates**
- Semver on `observability-sdk`; N-1 major-version support window.
- Schema deprecation cycle — 6-month window from announcement to cutover. CHANGELOG entry, announcement, mid-window reminder, cutover bump of `sdk_floor.txt`.
- Patches, security fixes, schema evolutions; quarterly review of adapter coverage and pricing-table accuracy.
- On-call rotation for SDK breakage that hits multiple projects.
- Price-table maintenance — subscription to provider pricing change feeds; update within 24h of vendor announcement.
- PII pre-scrub rule maintenance — coordinated with the privacy team; per-region rule variants for EU / US / APAC.
- Backend approval queue with 1-week SLA. Projects that request a backend not currently on the allow-list submit through the intake form.

**Owns paths**
- `<platform-repo>/observability-sdk/` — library, `emit()` core, async pipeline, PII pre-scrub.
- `<platform-repo>/observability-sdk/adapters/` — per-backend adapter plugins.
- `<platform-repo>/observability-schema/` — canonical schema, price table, allow-list, sdk_floor, CHANGELOG.
- `<platform-repo>/observability-workflows/` — published reusable CI workflow files (lint runners).
- `<platform-repo>/observability-sdk/docs/backend_request.md` — backend approval intake form + review checklist.

---

## 4. project_team

**Configures**
- `observability/config.yaml` at repo root — pins SDK version (≥ floor), declares default `target_backend`, declares the workload's `project_id`, names the `workload_pattern` family for this repo.
- `pyproject.toml` / `package.json` — dependency on `observability-sdk` pinned at a version ≥ the current floor.
- `.github/workflows/observability-lint.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three lint checks as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).

**Populates**
- Workload code — calls `observability_sdk.emit(project_id, workload_pattern, target_backend, payload)` at every model call, tool invocation, and retrieval boundary.
- Pattern-specific payload content (token counts, latency, retriever scores for RAG, tool names + evidence counts for agents).
- Optional `custom_payload` blob for workload-specific fields the canonical schema does not cover (e.g., a healthcare-specific drug-interaction span type). Opaque to central enrichment but forwarded to the backend.

**Consumes via**
- `pip install observability-sdk` (or the language-equivalent package manager).
- GitHub Actions: `uses: <org>/observability-workflows/.github/workflows/observability-lint.yml@v1`.
- Backend additions: submit `<platform-repo>/observability-sdk/docs/backend_request.md` to the central queue; expect a response within 1 week.

---

## 5. interface_contract

**SDK emit signature**
```python
def emit(
    project_id: str,
    workload_pattern: Literal["rag", "llm", "agent", "ml"],
    target_backend: Literal["langsmith", "datadog", "langfuse", "cloudwatch"],
    payload: dict,
    custom_payload: dict | None = None,
    trace_id: str | None = None,        # auto-generated if not supplied
    parent_span_id: str | None = None,  # for propagation across team boundaries
) -> None: ...
```

**Canonical event header** (central-owned, schema-controlled)
```yaml
header:
  # Local-supplied (mandatory — gate 2 enforces presence and value validity)
  project_id: string                       # must match project registry
  workload_pattern: rag | llm | agent | ml
  target_backend: langsmith | datadog | langfuse | cloudwatch
  trace_id: uuid                           # propagated or auto-generated
  parent_span_id: uuid | null

  # Central-enriched (added at emit time, project code cannot override)
  cost_center: string                      # looked up from project registry
  compliance_tier: regulated | sensitive | standard
  sdk_version: semver
  emit_timestamp: iso8601
  dollar_cost: float | null                # computed from payload.tokens × price_table
  pii_scrub_applied: bool
  region: us-east | eu-west | apac         # determined from project registry
```

**Payload contract** (project-owned; common shape recommended, custom_payload always permitted)
```yaml
payload:
  # Common across all patterns
  model_id: string
  model_provider: string
  tokens:
    prompt: int
    completion: int
    cached: int | null
  latency_ms: int
  finish_reason: stop | length | content_filter | tool_call | error

  # Pattern extensions — present when workload_pattern matches
  rag: { retriever_id, top_k, kb_version, scores, chunks_used, citation_count }
  agent: { step_index, tool_name, tool_status, evidence_count, terminated_by }

custom_payload: { ... }                    # opaque to central; forwarded as-is
```

**Allow-list snippet (`observability/allowed_imports.yaml`)**
```yaml
permitted_imports:
  - observability_sdk
  - observability_sdk.adapters.*
blocked_imports:
  - datadog
  - ddtrace
  - langsmith
  - langfuse
  - "boto3.client(('logs'|'cloudwatch'))"
  - "https?://(api|ingest)\\.(datadog|langsmith|langfuse)"
```

**Versioning**
- `observability-sdk` follows semver. Projects pin major version. N-1 supported.
- Schema deprecation: 6-month window. CHANGELOG entry + announcement + mid-window reminder + cutover.
- `sdk_floor.txt` bumps at each cutover. Gate 3 fires when a workload pins below the floor.

**Backend approval SLA**
- New-backend requests reviewed within 1 week. Reviewed against: data residency support, PII pre-scrub compatibility, vendor contract scope, retention policy. Outcomes: approved (added to allow-list + adapter built), rejected with reason, conditional (e.g., region-restricted).

---

## 6. acceptance_criteria

Project architect self-attests by confirming every item below is true. CI lint logs are the mechanical evidence.

- [ ] `observability/config.yaml` exists at repo root, validates against the central schema, and declares `project_id` matching the project registry.
- [ ] Pinned `observability-sdk` version ≥ the floor declared in `observability-schema/sdk_floor.txt`.
- [ ] Workload code imports `observability_sdk` (or equivalent language binding); every model call, tool invocation, and retrieval boundary in scope emits through `observability_sdk.emit()`.
- [ ] No direct calls to observability backends outside the central adapter layer — gate 1 lint passes on the integration branch.
- [ ] Every `observability_sdk.emit()` call supplies `project_id`, `workload_pattern ∈ {rag, llm, agent, ml}`, and `target_backend` from the approved-backends list — gate 2 lint passes on the integration branch.
- [ ] The pinned SDK version ≥ floor — gate 3 lint passes on the integration branch.
- [ ] All three gate lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.
- [ ] Any `target_backend` not on the central allow-list has either gone through the backend approval workflow (with a documented outcome) or is replaced before merge.
