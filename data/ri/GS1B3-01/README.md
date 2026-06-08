# Reference Implementation — GS1B3-01

## 1. principle_id
GS1B3-01 — Never retrieve what the user isn't allowed to see. Every retrieval from a shared (multi-tenant or mixed-authorization) vector store is scoped to the requesting user's permissions: documents are labelled with access-control metadata at ingestion, and all retrieval routes through a central retrieval SDK that resolves the caller's entitlements and applies an identity pre-filter. Direct vector-store client calls against a multi-tenant store are prohibited. (Option A — labelled-and-routed.)

## 2. tier_outcome
**mandatory_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): **yes** — cross-tenant / cross-department retrieval of PII or confidential data is direct legal and regulatory exposure (GDPR, data residency, broken access control / OWASP LLM cross-tenant leakage). First D1=yes principle in the catalogue; the legal-exposure veto forces centralisation regardless of D2.
- D2 (repeatability_cost): 3 — a central retrieval SDK with IdP entitlement resolution and per-store pre-filtering across vector backends, an acl schema, ingestion-labelling tooling, three pre-merge lints, and a quarterly label-audit workflow. Weeks of platform/security engineering per project if rebuilt locally, plus ongoing maintenance.
- audit_mode: **central_review_at_gate** (validator: enterprise_security) — the mechanical lints are CI-enforced, but the residual label-correctness gap is a security-owned periodic review, so a central validator inspects evidence.

---

## 3. central_team

**Builds**
- `retrieval-sdk` library (Python first; TypeScript/Java to follow) — `retrieve(query, caller_identity, store_id, top_k)` entry point. Resolves the caller's entitlements from the IdP and applies an identity-scoped **pre-filter** during the nearest-neighbour search (not a post-filter). The workload passes caller identity; it never builds the filter and never holds the store client.
- Per-backend adapters (`retrieval_sdk.adapters.pinecone`, `.opensearch`, `.pgvector`, `.bedrock_kb`) mapping the identity filter to each store's native metadata-filter / fine-grained-access mechanism.
- `acl` schema at `retrieval-schema/acl.v1.yaml` — the document-label contract (`allowed_roles`/groups, optional `classification`), plus the entitlement-resolution contract (IdP claim → role set).
- Store registry at `retrieval-schema/stores.yaml` — which stores are multi-tenant (in scope for the gates) vs single-tenant.
- IdP integration — entitlement resolution from the enterprise identity provider (OIDC/SAML group claims → role set), cached with a short TTL.
- Lint plugins for the three pre_merge gates (ingestion acl-labelling; routed-retrieval AST ban on direct store calls; SDK version floor) + CI workflow templates.
- SDK version floor at `retrieval-schema/sdk_floor.txt` — source of truth for the version-floor gate.
- Quarterly label-audit tooling — a sampler that pulls a random set of ingested chunks per store and surfaces their `acl` labels alongside source-system classification for the security team to compare.

**Operates**
- Semver on `retrieval-sdk`; N-1 major-version support window; schema deprecation cycle with a floor bump at cutover.
- IdP entitlement-resolution maintenance (claim-mapping changes, new roles/groups) coordinated with the identity team.
- Adapter maintenance as vector backends evolve their filtering APIs.
- Quarterly label-audit cadence with the security team; finding-tracking to closure.
- On-call for SDK breakage affecting multiple projects.

**Owns paths**
- `<platform-repo>/retrieval-sdk/` — library, `retrieve()` core, pre-filter, IdP resolution.
- `<platform-repo>/retrieval-sdk/adapters/` — per-backend adapters.
- `<platform-repo>/retrieval-schema/` — acl schema, stores registry, sdk_floor, CHANGELOG.
- `<platform-repo>/retrieval-workflows/` — published reusable CI lint workflows.

---

## 4. project_team

**Configures**
- `retrieval/stores.yaml` at repo root — declares each vector store the workload uses and whether it is multi-tenant (in scope).
- `retrieval/config.yaml` — pins the `retrieval-sdk` version (≥ floor), declares the default `store_id` and the IdP entitlement source.
- `.github/workflows/retrieval-access-check.yml` — calls the central reusable lint workflow.
- Branch protection — wires the three lint checks as **required** status checks on the integration branch.

**Populates**
- Ingestion code — every write to a multi-tenant store sets the `acl` block on each document/chunk (`allowed_roles`/groups + optional `classification`). The classification is derived from the source-system permission or the data-classification register, not invented.
- Retrieval code — calls `retrieval_sdk.retrieve(query, caller_identity, store_id)` at every retrieval boundary; passes the authenticated caller identity from the request context, never a hand-built filter.

**Consumes via**
- `pip install retrieval-sdk` (or language equivalent).
- GitHub Actions: `uses: <org>/retrieval-workflows/.github/workflows/retrieval-access-check.yml@v1`.
- New-backend or acl-schema-change requests: submit to the central retrieval-platform queue.

---

## 5. interface_contract

**SDK retrieve signature**
```python
def retrieve(
    query: str,
    caller_identity: Identity,          # authenticated principal from request context
    store_id: str,
    top_k: int = 8,
) -> list[Chunk]: ...                    # only chunks the caller's roles permit
```
The SDK resolves `caller_identity` → role set via the IdP, then issues the nearest-neighbour search with an `acl.allowed_roles ∈ caller_roles` **pre-filter**. The caller cannot pass a filter; the caller cannot widen the role set.

**Document acl block (set at ingestion)**
```yaml
acl:
  allowed_roles: [finance, exec]        # roles/groups permitted to retrieve this chunk
  classification: confidential          # optional: public | internal | confidential | restricted
```

**Store registry**
```yaml
stores:
  - id: support-kb
    multi_tenant: false                 # out of scope for the gates
  - id: enterprise-shared
    multi_tenant: true                  # in scope — labels + routed retrieval enforced
```

**Versioning** — `retrieval-sdk` follows semver; projects pin major; `sdk_floor.txt` bumps at each filtering-logic or acl-schema cutover; gate 3 fires below floor.

---

## 6. acceptance_criteria

Project architect self-attests for the mechanical items (CI lint logs are the evidence); the enterprise security team signs off the quarterly label-audit.

- [ ] `retrieval/stores.yaml` exists and correctly flags every multi-tenant store.
- [ ] Every ingestion write path to a multi-tenant store populates the `acl` block — gate 1 lint passes on the integration branch.
- [ ] No direct vector-store client call against a multi-tenant store; all retrieval routes through `retrieval_sdk.retrieve(...)` with caller identity — gate 2 AST lint passes on the integration branch.
- [ ] Pinned `retrieval-sdk` version ≥ the floor in `retrieval-schema/sdk_floor.txt` — gate 3 lint passes.
- [ ] All three lints are configured as **required** status checks on the integration branch via branch protection (advisory CI runs do not satisfy this).
- [ ] The quarterly security label-audit has been run for each multi-tenant store; sampled `acl` labels match source-system classification; any mislabelling findings are tracked to closure. (This is the human control for the property the lints cannot verify — see `enforcement_limits.md`.)

> **Enforcement boundary (read `data/enforcement_limits.md`):** the three lints enforce the *plumbing* — identity-scoped retrieval and labels present. They cannot verify a label is *correct*; a document mislabelled `public` is served faithfully to everyone. Correct labels depend on developer discipline at ingestion, which is why the quarterly security label-audit is a binding acceptance criterion, not an optional extra.
