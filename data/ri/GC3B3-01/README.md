# Reference Implementation — GC3B3-01

## 1. principle_id
GC3B3-01 — Don't pay twice for the same prompt content. Every registered prompt template declares its static-prefix token count and a cache decision (checkpoint or opt-out) in the GO3B1-01 manifest; a pre-merge gate fails the build when the count is undeclared, when a cache-eligible template (static prefix ≥ the model's minimum cache size) is neither cached nor opted out, or when the declared prefix count diverges from the value CI recomputes with the model's own tokenizer.

This RI is built on **Option A (declared-and-recomputed, manifest-derivable)** — the principle's mandated spine. **Option C (runtime telemetry alarm on cache hit-rate)** is documented at the end as an alternative implementation a workload MAY adopt **in addition to** Option A; it is not a substitute for the Option A gate.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — marking a cacheable prompt prefix is cost discipline; no regulator, external audit, or litigation exposure.
- D2 (repeatability_cost): 2 — a cache-eligibility lint plus a recompute-variance lint, with ongoing tokenizer and per-model cache-minimum maintenance, reused across projects. Thinner than GO3B1-01's D2=3 because it extends GO3B1-01's existing tokenizer integration and manifest schema rather than building new ones; still beyond what each project should rebuild locally.

Validation stays project-architect self-attestation against the central tooling; CI logs are the mechanical evidence. Same shape as GO3B1-01, GC3B1-01, and GC2B2-01 — the enterprise tier is about who builds the lint, not who clicks a URL.

---

## 3. central_team

**Builds**
- `cache_check` lint plugin (shipped inside the GO3B1-01 `llm-sdk` lint suite). For each registered template it: (a) fails when `cache.static_prefix_tokens` is absent; (b) reads the model's minimum cache-checkpoint size from `models/cache_minimums.yaml` and, for any template whose declared `static_prefix_tokens` ≥ that minimum, fails unless `cache.checkpoint: true` or a non-empty `cache.opt_out` reason is present; (c) recomputes the static prefix — the contiguous body span up to the first `{{variable}}`, tokenised with the model's own tokenizer named in the manifest `model` field — and fails when the declared count diverges from the recomputed value beyond the declared tolerance (default 10%).
- `models/cache_minimums.yaml` — a central, platform-owned table mapping each catalogued model identifier to its minimum cache-checkpoint token count (e.g. an Anthropic model's ~1,024-token minimum), maintained against provider documentation.
- The central SDK's provider-neutral caching contract — the call path that emits a cache checkpoint at the end of the declared static prefix, mapping to the provider's mechanism (Anthropic `cache_control`, OpenAI prefix caching, Bedrock cache checkpoints) so workload code marks caching once, vendor-agnostically.
- Reuse of GO3B1-01's per-provider tokenizer adapters (`llm_sdk.tokenizers.{anthropic,openai,bedrock,azure}`) — no new tokenizer code; the prefix recompute calls the same adapters so the count matches what the SDK measures at runtime.
- CI workflow template extension — adds the `cache_check` lint to the existing `llm-sdk-lint.yml` reusable workflow.

**Operates**
- Versioning on the cache lint in step with the `llm-sdk` semver and `sdk_floor.txt` floor.
- Quarterly maintenance of `models/cache_minimums.yaml` against provider docs (minimums and caching support change as providers ship models).
- Tokenizer-adapter accuracy review (shared with GO3B1-01 / GC3B1-01).
- On-call for cache-lint breakage hitting multiple projects.

**Owns paths**
- `<platform-repo>/llm-sdk/lints/cache_check/`
- `<platform-repo>/llm-sdk/models/cache_minimums.yaml`
- `<platform-repo>/llm-sdk-workflows/` — the extended reusable lint workflow.

---

## 4. project_team

**Configures**
- The existing `prompts/manifest.yaml` (Mode A) or TMS metadata (Mode B) from GO3B1-01 — adds a `cache` block per template: a **real** `static_prefix_tokens` count (matching the actual fixed leading span, not a placeholder) and a cache decision (`checkpoint: true` or an honest `opt_out` reason).
- `.github/workflows/llm-sdk-lint.yml` — already calls the central reusable workflow; no change beyond pinning the `llm-sdk` version that contains the cache lint.
- Branch protection — the cache lint is wired as a **required** status check on the integration branch (`develop` in git-flow, `main` in trunk-based), alongside GO3B1-01's and GC3B1-01's lints.

**Populates**
- Prompt bodies structured so the stable, reusable content (system instructions, fixed schema, retrieved-but-static context) leads and the per-call variables follow, so the cacheable prefix is contiguous and as large as the design allows.
- An `opt_out` reason whenever a cache-eligible template is deliberately left uncached (e.g. "called <10×/day, below cache TTL reuse — write cost exceeds read savings").

**Consumes via**
- `pip install llm-sdk` (or the language-equivalent) pinned at a version ≥ the floor that ships the cache lint and the caching contract.
- GitHub Actions: `uses: <org>/llm-sdk-workflows/.github/workflows/llm-sdk-lint.yml@v1`.

---

## 5. interface_contract

**Cache block (added to the GO3B1-01 manifest row — this principle enforces it)**
```yaml
templates:
  - id: support_assistant
    version: 2.1.0
    body: prompts/support_assistant.md      # stable product-manual prefix, then {{user_query}}
    variables:
      - name: user_query
        typical_max: 400
    model: claude-sonnet-4-6
    runtime_token_budget:
      input: 8000
      output: 512
    cache:
      static_prefix_tokens: 5800            # DECLARED; recomputed and variance-checked at pre-merge
      checkpoint: true                      # required because 5800 >= model minimum (~1024)
      # opt_out: "called <10x/day; write cost exceeds read savings"   # alternative to checkpoint
    owner: support-platform
    status: active
```

**Central per-model minimums (`models/cache_minimums.yaml`, platform-owned)**
```yaml
claude-sonnet-4-6: 1024
claude-haiku-4-5: 2048
gpt-class-large: 1024
```

**Gate 1 — declare + eligibility (pre_merge, blocking)**
For every template:
```
FAIL if cache.static_prefix_tokens is absent
min = cache_minimums[model]
if cache.static_prefix_tokens >= min:
    FAIL unless (cache.checkpoint == true OR cache.opt_out is non-empty)
```
Required status check on the integration branch. Advisory CI does not satisfy the gate.

**Gate 2 — recompute variance (pre_merge, blocking)**
For every template:
```
recomputed = tokenize(model, body_prefix_up_to_first_placeholder)
FAIL if abs(cache.static_prefix_tokens - recomputed) / recomputed > tolerance   # default 0.10
```
Catches a prefix broken by a leading variable (recomputed shrinks) and a hand-declared count that does not match the body. Required status check on the integration branch. Advisory CI does not satisfy the gate.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every registered template declares `cache.static_prefix_tokens` reflecting the real fixed leading span, not a placeholder.
- [ ] Every cache-eligible template (`static_prefix_tokens` ≥ its model's minimum in `models/cache_minimums.yaml`) sets `cache.checkpoint: true` or carries a non-empty `cache.opt_out` reason — Gate 1 passes on the integration branch.
- [ ] For every template, the declared `static_prefix_tokens` is within tolerance of the recomputed contiguous-prefix tokenisation — Gate 2 passes on the integration branch.
- [ ] Prompt bodies are structured stable-prefix-first so the cacheable span is contiguous and ahead of the first variable.
- [ ] The pinned `llm-sdk` version is ≥ the floor that ships the cache lint and the caching contract.
- [ ] The cache lint is configured as a **required** status check on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.

---

## 7. Alternative implementation (optional, additive to Option A)

This gives a workload runtime assurance Option A's manifest-derivable check cannot provide. A workload MAY adopt it **in addition to** the Option A gate above; it does not replace it.

**Option C — runtime telemetry alarm.** GO3B2-01's central observability stream already carries per-call data. Wire the cache hit-rate and the actual production prefix size into an alarm (the GC2B2-01 alarm pattern) that dashboard-flags or pages when a cache-eligible template's production cache hit rate falls below a threshold, or when its actual prefix diverges from the declared `static_prefix_tokens`. This catches runtime cache misses Option A cannot see — TTL expiry under low traffic, non-contiguous variable fills, a provider-side caching change. It is post-deploy observability, not a pre-merge gate; it cannot block a merge and belongs to the GO3B2 observability family, so it complements the CI gate rather than substituting for it. (AWS GENCOST03-BP03 step 3 — "Monitor caching metrics: track cache hit and miss rates" — is realised here.)
