# ADR — Model catalog: model-card governance against an immutable model catalog

- **Status:** Accepted
- **Date:** 2026-06-23
- **Context source:** AWS Well-Architected GenAI Lens GENREL04 (Prompt management), BP02 "Implement a model catalog" (live page fetched 2026-06-23; risk **Low**)
- **Catalogue decision:** GENREL04-BP02 **not_promoted** — absorbed by **GO1B1-06** (immutable model pinning + approved catalog). This ADR records the one residual slice (model cards) and recommends a GO1B1-06 schema extension rather than a new standard.

## Problem

AWS GENREL04-BP02 asks for a centralized model catalog that stores model versions and model cards, supports deploy/rollback to a given model version, records model access/lineage/customizations, and carries model cards (capabilities, limitations, training-data characteristics, intended use, ethical considerations / biases). Risk if not established: **Low**.

## Why no principle

The catalogue already mandates the model catalog. **GO1B1-06** ("Know which model you're running, and re-prove behaviour before you change it") requires every foundation-model reference to resolve to an entry in an approved catalog (`models/catalog.yaml` or the platform-owned catalog it points to), every entry an exact immutable version (dated provider snapshot or self-hosted weights digest), floating aliases banned, enforced by a pre-merge catalog-membership lint, with a re-eval gate on any version change. Mapping BP02's six steps:

- **Step 1 (catalog structure — classification, metadata schema, versioning, access control)** → GO1B1-06's catalog + entry schema.
- **Step 2 (model tracking — lineage, versions, customizations, benchmarks)** → GO1B1-06 catalog entries; benchmarks ride GO1B1-01.
- **Step 4 (governance — approval, deployment, monitoring, security, usage)** → GO1B1-06 catalog membership + GO3B2-01 monitoring + base-WAF.
- **Step 5 (maintenance — update, deprecation, archival, backup)** → GO1B1-06 catalog lifecycle.
- **Step 6 (validation — testing, acceptance, benchmarking, quality gates)** → GO1B1-01 eval harness + GO1B1-06 re-eval-on-change gate.

Five of six steps are already discharged. BP02 is the Reliability-framed twin of GO1B1-06 (an Operational-Excellence standard).

step_promotion score: **3/3/2/3 → not_promote.**

## The residual slice

**Step 3 — model cards.** GO1B1-06's catalog entry pins a model version but does not carry a **model card**: documented capabilities and limitations, training-data characteristics, intended use cases and constraints, and ethical considerations / biases. This is a governance-document artefact, not a reliability gate, and it is partly a **responsible-AI / GENSEC** concern (bias, intended-use constraints) rather than a Reliability one.

## Recommendation

Add an optional `model_card` field to GO1B1-06's catalog entry schema — a path or structured block covering capabilities, limitations, training-data characteristics, intended use / constraints, and ethical considerations / biases — existence-linted in the catalog-membership lint. The responsible-AI substance (bias assessment, intended-use enforcement) is left to a future **GENSEC / responsible-AI** walk, not forced onto a reliability standard here. No new principle, no new platform component — one optional schema field on an existing standard, plus a flagged GENSEC candidate.

## Consequences

- GENREL04-BP02 closes with no new standard; GENREL04 (both BPs) closes empty.
- GO1B1-06 gains an optional `model_card` field when the schema-extension PR lands (not done in this walk — recommendation only; `principles.json` unchanged).
- Model-card bias / intended-use enforcement logged as a responsible-AI / GENSEC candidate.
- mapping_state: BP02 verbatim **verified** (live page fetched 2026-06-23).
