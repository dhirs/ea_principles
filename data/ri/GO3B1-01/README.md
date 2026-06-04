# Reference Implementation — GO3B1-01

## 1. principle_id
GO3B1-01 — Route every model call through a registered, versioned prompt template via the central SDK. Every prompt lives as a registered, versioned template addressable by `template_id`; the central LLM SDK refuses inline-string prompts and accepts only `(template_id, variables)` call signatures.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no (borderline — prompts in regulated industries may embed policy / disclosure content; same hedge as GO3B2-01).
- D2 (repeatability_cost): 3 — central LLM SDK across multiple languages, tokenizer integration per provider (Anthropic, OpenAI, Bedrock, Azure), three CI lints, manifest schema + validator, optional TMS adapter set, observability hooks for budget overrun signals. Weeks of platform engineering per project if local, plus continuous maintenance.

---

## 3. central_team

**Builds**
- `llm-sdk` library (Python first; TypeScript and Java to follow) — `generate()` entry point with `(template_id, variables)` signature, template resolution from configured backend (Mode A file walker, Mode B TMS adapter), composition (system + user assembly), variable validation against declared schema, tokenizer integration per provider, async non-blocking observability emit.
- Tokenizer adapters as plugin modules — `llm_sdk.tokenizers.anthropic`, `.openai`, `.bedrock`, `.azure`. Each adapter calls the provider's official `count_tokens` API (or equivalent local tokenizer) to compute exact input + output tokens per call.
- TMS adapters as separate plugin modules (only if Mode B is supported organisation-wide) — `llm_sdk.tms.bedrock_pm`, `.langfuse`, `.promptlayer`, `.humanloop`, `.mlflow_prompt_registry`. Each adapter fetches template body + metadata from the hosted service.
- Manifest schema definition at `llm-sdk-schema/manifest.v1.yaml` — declares the required fields per template row: `id`, `version`, `body` (path for Mode A or TMS reference for Mode B), `variables` (name + typical_max + on_overflow policy), `output_schema`, `model`, `runtime_token_budget.input`, `runtime_token_budget.output`, `owner`, `status` ∈ {draft, active, deprecated, archived}.
- Prohibited-imports list at `llm-sdk-schema/prohibited_calls.yaml` — direct provider-SDK invocations banned in workload code. Source of truth for gate 2.
- SDK version floor at `llm-sdk-schema/sdk_floor.txt` — the minimum SDK version below which deprecated registration schemas would be in use. Source of truth for gate 3.
- Lint plugins for the three pre_merge gates (template_id ↔ registry consistency, no-inline-call AST scan, version-floor check).
- CI workflow templates (GitHub Actions / GitLab CI / Buildkite — reusable workflow files).
- `CHANGELOG.md` + announcement template for each schema rev (email + Slack `#llm-sdk-announce`).
- TMS-backend approval workflow (if Mode B is supported) — intake form, review checklist (data residency, vendor contract, retention policy, audit-trail support), **1-week SLA** to approval / rejection / conditional.

**Operates**
- Semver on `llm-sdk`; N-1 major-version support window.
- Schema deprecation cycle — 6-month window from announcement to cutover. CHANGELOG entry, announcement, mid-window reminder, cutover bump of `sdk_floor.txt`.
- Patches, security fixes, schema evolutions; quarterly review of tokenizer-adapter accuracy against provider billing.
- On-call rotation for SDK breakage that hits multiple projects.
- Tokenizer adapter maintenance — subscription to provider-side tokenizer changes (Anthropic / OpenAI release notes); update within 1 week of provider-side changes.
- TMS-backend approval queue with 1-week SLA (if Mode B is supported organisation-wide).

**Owns paths**
- `<platform-repo>/llm-sdk/` — library, `generate()` core, composition layer, async observability pipeline.
- `<platform-repo>/llm-sdk/tokenizers/` — per-provider tokenizer adapter plugins.
- `<platform-repo>/llm-sdk/tms/` — per-TMS adapter plugins (if Mode B is supported).
- `<platform-repo>/llm-sdk-schema/` — manifest schema, `prohibited_calls.yaml`, `sdk_floor.txt`, CHANGELOG.
- `<platform-repo>/llm-sdk-workflows/` — published reusable CI workflow files (lint runners).
- `<platform-repo>/llm-sdk/docs/tms_request.md` — TMS-backend approval intake form (Mode B).

---

## 4. project_team

**Configures**
- **Mode A:** `prompts/manifest.yaml` at repo root — declares one row per template (`id`, `version`, `body`, `variables`, `output_schema`, `model`, `runtime_token_budget`, `owner`, `status`). `prompts/<template_id>.{md,j2}` per template — body content with `{{variable}}` placeholders.
- **Mode B:** `prompts/tms_config.yaml` at repo root — declares the TMS endpoint, the workload's TMS namespace, and the version-pinning strategy (build-time pull or runtime fetch). Template bodies + metadata live in the TMS, edited via UI.
- Common (both modes): `prompts/sdk_floor.txt` reference + `pyproject.toml` / `package.json` dependency on `llm-sdk` pinned at a version ≥ floor.
- `.github/workflows/llm-sdk-lint.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three lint checks as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).

**Populates**
- Workload code — calls `llm_sdk.generate(template_id="X", variables={...})` at every model call boundary. No inline-string prompts. No direct provider-SDK calls.
- **Mode A:** template body files at `prompts/<template_id>.{md,j2}` + manifest rows. Versioning via git + manifest `version` field bumps.
- **Mode B:** template bodies + metadata authored in the TMS UI (or via TMS-specific CLI / API). The workload references templates by `id` only.
- Budget rationale entries in the workload's change history each time a `runtime_token_budget` value is raised.

**Consumes via**
- `pip install llm-sdk` (or the language-equivalent package manager).
- GitHub Actions: `uses: <org>/llm-sdk-workflows/.github/workflows/llm-sdk-lint.yml@v1`.
- TMS additions (Mode B): submit `<platform-repo>/llm-sdk/docs/tms_request.md` to the central queue; expect a response within 1 week.

---

## 5. interface_contract

**SDK generate signature**
```python
def generate(
    template_id: str,
    variables: dict,
    model: str | None = None,           # optional override; default from manifest
    dev_only: bool = False,              # permits unregistered templates against dev model endpoints only; rejected against prod
    trace_id: str | None = None,
    parent_span_id: str | None = None,
) -> str: ...
```

**Manifest row schema** (Mode A — `prompts/manifest.yaml`)
```yaml
templates:
  - id: string                                # unique within workload
    version: semver                           # e.g. "1.2.0"
    body: string                              # path to body file, e.g. "prompts/triage.md"
    variables:
      - name: string
        typical_max: int                      # typical max tokens for this variable
        on_overflow: reject | truncate        # policy when actual > typical_max
    output_schema: object | null              # JSON schema for structured outputs
    model: string                             # e.g. "claude-sonnet-4-6"
    runtime_token_budget:
      input: int                              # max assembled input tokens
      output: int                             # max generated tokens (used as max_tokens on the API call)
    owner: string                             # team identifier (CODEOWNERS-style)
    status: draft | active | deprecated | archived
```

**TMS config schema** (Mode B — `prompts/tms_config.yaml`)
```yaml
provider: bedrock_pm | langfuse | promptlayer | humanloop | mlflow_prompt_registry
endpoint: string                              # service URL or AWS region
namespace: string                             # workload's TMS namespace
version_pinning: build_time_pull | runtime_fetch
cache_ttl_seconds: int | null                 # for runtime_fetch
```

**Prohibited-imports snippet** (`prompts/prohibited_calls.yaml`)
```yaml
prohibited_calls:
  - "anthropic.Anthropic().messages.create"
  - "openai.OpenAI().responses.create"
  - "openai.OpenAI().chat.completions.create"
  - "boto3.client('bedrock-runtime').invoke_model"
  - "openai.AzureOpenAI().chat.completions.create"
  - "openai.AzureOpenAI().responses.create"
```

**Versioning**
- `llm-sdk` follows semver. Projects pin major version. N-1 supported.
- Schema deprecation: 6-month window. CHANGELOG entry + announcement + mid-window reminder + cutover.
- `sdk_floor.txt` bumps at each cutover. Gate 3 fires when a workload pins below the floor.

**TMS approval SLA** (Mode B)
- New-TMS-backend requests reviewed within 1 week. Reviewed against: data residency, vendor contract scope, audit-trail support, retention policy. Outcomes: approved (added to allow-list + adapter built), rejected with reason, conditional.

---

## 6. acceptance_criteria

Project architect self-attests by confirming every item below is true. CI lint logs are the mechanical evidence.

- [ ] **Mode A:** `prompts/manifest.yaml` exists at repo root, validates against the central manifest schema, and declares one row per template with all required fields. Each row has a matching body file at the declared `body` path. **OR Mode B:** `prompts/tms_config.yaml` exists, validates against the central TMS-config schema, and references a TMS backend on the central allow-list.
- [ ] Pinned `llm-sdk` version ≥ the floor declared in `llm-sdk-schema/sdk_floor.txt`.
- [ ] Workload code imports `llm_sdk` (or equivalent language binding); every model call routes through `llm_sdk.generate(template_id=..., variables=...)`. No inline-string prompts. No direct provider-SDK calls (`anthropic.Anthropic`, `openai.OpenAI`, `boto3.client('bedrock-runtime')`, Azure OpenAI client) outside the central SDK module.
- [ ] Every `template_id` referenced in `src/` resolves to a registry entry (Mode A: manifest row + body file; Mode B: TMS API returns a record) — gate 1 lint passes on the integration branch.
- [ ] Every registry entry has a matching `src/` reference (no orphan templates) — gate 1 lint passes on the integration branch.
- [ ] No direct provider-SDK invocations in workload code outside the central SDK module — gate 2 lint passes on the integration branch.
- [ ] The pinned SDK version ≥ floor — gate 3 lint passes on the integration branch.
- [ ] All three gate lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.
- [ ] Any TMS backend reference (Mode B) is on the central allow-list, or has gone through the TMS approval workflow with a documented outcome.
