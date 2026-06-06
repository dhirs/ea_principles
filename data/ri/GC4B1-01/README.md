# Reference Implementation — GC4B1-01

## 1. principle_id
GC4B1-01 — Use the smallest embedding vector that still retrieves well. Every vector store declares its embedding model, the vector dimension it embeds at, and the retrieval-quality result that justified that dimension; a pre-merge gate fails the build when the declaration is missing, when the deployed index dimension does not match the declared one, or when the dimension is raised without a recorded cost/quality rationale.

This RI is built on **Option A (declared-and-verified, config-derivable)** — the principle's mandated spine. Option B (measured-from-retrieval-eval) is documented at the end as an alternative a workload may adopt **in addition to** Option A; it is not a substitute for the Option A gate.

## 2. tier_outcome
**recommended_centralise** → `ownership.tier: enterprise`
- D1 (legal_exposure): no — choosing an embedding dimension against a cost/quality trade-off is cost discipline; no regulator, external audit, or litigation exposure.
- D2 (repeatability_cost): 2 — a declaration+consistency lint with a multi-backend index-config parser, plus a dimension-inflation governance lint, reused across projects. Beyond what each project should rebuild locally; lighter than GC2B2-01 (which parses GPU/instance/precision and verifies deployed alarms) because it reads a single scalar — the index dimension — from config.

Validation stays project-architect self-attestation against the central tooling; CI logs are the mechanical evidence. Same shape as the cost siblings — the enterprise tier is about who builds the lint, not who clicks a URL.

---

## 3. central_team

**Builds**
- `dimension_check` lint plugin — for each vector store, (1) verifies the `vectorstore/embedding.yaml` declaration exists and populates `embedding_model`, `vector_dimension`, `quality_floor`, `quality_result`, `checked_on`; (2) parses the vector-store index configuration (Terraform/IaC resource or index-creation definition) and fails when the provisioned index dimension differs from the declared `vector_dimension`.
- `dimension_inflation_check` lint plugin — diffs `vectorstore/embedding.yaml` against the merge base; fails any PR that raises `vector_dimension` without an accompanying rationale (declaration `change_history` entry or linked ADR under `docs/adrs/`).
- Multi-backend index-config parser adapters (`vectorstore.parsers.{pinecone,pgvector,opensearch,weaviate,terraform}`) — read the deployed/declared index dimension from each supported backend so the consistency check matches what is actually provisioned.
- CI workflow template — a reusable `vectorstore-lint.yml` running both lints.
- Optional cross-project vector-store cost dashboard surface — per-store declared dimension vs deployed dimension vs (if Option B adopted) smallest dimension clearing the quality floor.

**Operates**
- Versioning on the lints and the parser adapters in step with the platform `vectorstore` tooling semver.
- Parser-adapter accuracy review — quarterly check that the parsed deployed dimension matches the live index for each backend (backends shift their config schema).
- On-call for lint breakage hitting multiple projects.

**Owns paths**
- `<platform-repo>/vectorstore/lints/dimension_check/`
- `<platform-repo>/vectorstore/lints/dimension_inflation_check/`
- `<platform-repo>/vectorstore-workflows/` — the reusable lint workflow.

---

## 4. project_team

**Configures**
- `vectorstore/embedding.yaml` — declares the embedding model, the chosen `vector_dimension` (the smallest that clears the quality floor), the `quality_floor` (metric + threshold), the measured `quality_result`, and `checked_on`.
- `.github/workflows/vectorstore-lint.yml` — calls the central reusable workflow; pin the `vectorstore` tooling version that ships the lints.
- Branch protection — both lints wired as **required** status checks on the integration branch (`develop` in git-flow, `main` in trunk-based).

**Populates**
- The retrieval-quality measurement behind `quality_result` — run the candidate dimensions against the workload's retrieval-quality check and record the value that justifies the chosen dimension.
- A dimension-change rationale (declaration `change_history` entry or `docs/adrs/` ADR) each time `vector_dimension` is raised, recording the reason and the vector-store cost delta.

**Consumes via**
- `pip install vectorstore-tools` (or the language-equivalent) pinned at a version ≥ the floor that ships the lints.
- GitHub Actions: `uses: <org>/vectorstore-workflows/.github/workflows/vectorstore-lint.yml@v1`.

---

## 5. interface_contract

**Declaration (`vectorstore/embedding.yaml`)**
```yaml
stores:
  - id: support_kb
    embedding_model: gemini-embedding-2     # tokenizer/dimension source
    vector_dimension: 768                    # ENFORCED: deployed index must match this
    quality_floor:
      metric: top_5_recall
      threshold: 0.95
    quality_result: 0.951                    # measured at vector_dimension=768
    checked_on: 2026-06-06
    index_config: infra/pinecone_support_kb.tf
    owner: search-platform
```

**Gate 1 — declaration + deployed-vs-declared consistency (pre_merge, blocking)**
For every vector store:
```
FAIL if vectorstore/embedding.yaml absent
FAIL if any of {embedding_model, vector_dimension, quality_floor, quality_result, checked_on} blank
deployed_dimension = parse_index_dimension(index_config)   # backend-specific adapter
FAIL if deployed_dimension != vector_dimension
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

**Gate 2 — dimension-inflation governance (pre_merge, blocking)**
```
For each store changed in the PR (diff vs merge base):
  if vector_dimension increased:
    REQUIRE a rationale: a change_history entry on that declaration,
      OR a linked ADR under docs/adrs/ naming the reason + vector-store cost delta
  FAIL if the increase has no accompanying rationale
```
Configured as a required status check on the integration branch via branch protection. Advisory CI does not satisfy the gate.

---

## 6. acceptance_criteria

Project architect self-attests; CI lint logs are the mechanical evidence.

- [ ] Every vector store declares `embedding_model`, `vector_dimension`, `quality_floor`, `quality_result`, and `checked_on` — none blank.
- [ ] The declared `vector_dimension` is the smallest that clears the recorded `quality_floor` (the `quality_result` justifies the choice, not a default taken unquestioned).
- [ ] The deployed index dimension equals the declared `vector_dimension` — Gate 1 passes on the integration branch.
- [ ] No PR raises `vector_dimension` without an accompanying rationale — Gate 2 passes on the integration branch.
- [ ] The pinned `vectorstore` tooling version is ≥ the floor that ships the lints.
- [ ] Both lints are configured as **required** status checks on the integration branch via branch protection. Advisory CI runs do not satisfy this criterion.

---

## 7. Alternative implementation (optional, additive to Option A)

This gives a workload a gate that enforces "smallest that works" directly, rather than trusting the recorded `quality_result`. A workload MAY adopt it **in addition to** the Option A gate above; it does not replace it.

**Option B — measured-from-retrieval-eval.** Run the candidate corpus through a retrieval-quality harness at several dimensions (e.g. 256 / 512 / 768 / 1024, using a Matryoshka/MRL model's truncation or separate embeds), and add a pre-merge gate that fails when a smaller dimension than the declared `vector_dimension` would have cleared the `quality_floor`. Closer to enforcing the mandate because it proves the chosen dimension is actually the smallest viable one; cost is the coupling to a representative retrieval-eval fixture set and a re-embed of the eval corpus at each candidate dimension. Requires a retrieval-quality harness to exist (GENPERF04 / the GO1B1 family's retrieval analogue).
