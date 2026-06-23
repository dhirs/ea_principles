# ADR — Prompt catalog: versioning hyperparameters and model-compatibility against prompt versions

- **Status:** Accepted
- **Date:** 2026-06-23
- **Context source:** AWS Well-Architected GenAI Lens GENREL04 (Prompt management), BP01 "Implement a prompt catalog" (live page fetched 2026-06-23; risk **Medium**)
- **Catalogue decision:** GENREL04-BP01 **not_promoted** — absorbed by **GO3B1-01** (prompt registry) + **GO1B1-01** (eval harness). This ADR records the one residual slice and recommends a GO3B1-01 schema extension instead of a new standard.

## Problem

AWS GENREL04-BP01 asks for a centralized, versioned prompt catalog with rollback, a testing framework that gates a prompt to "live" once it passes thresholds, versioned hyperparameter ranges (temperature / top_p / top_k) validated against prompt versions, and prompt test results maintained against several model versions.

## Why no principle

The catalogue already mandates the prompt catalog. **GO3B1-01** ("Treat prompts as governed assets") requires every prompt to live in a registry (`prompts/manifest.yaml` + body files, or a hosted TMS) with a per-row schema (`id`, `version`, `body`, `variables`, `output_schema`, `model`, `runtime_token_budget`, `owner`, `status ∈ {draft, active, deprecated, archived}`), enforced by a pre-merge lint, no inline strings. Mapping BP01's five steps:

- **Step 1 (catalog structure — metadata schema, versioning, naming, access control)** → GO3B1-01 verbatim.
- **Step 2 (version control, changelog, rollback)** → GO3B1-01's `version` + `status` lifecycle; rollback = revert to a prior `active` version.
- **Step 3 (testing framework, success criteria, release-to-live on passing thresholds)** → **GO1B1-01** eval harness, which already gates a change to production on passing known-good behaviour.
- **Step 5 (governance — approval, audit trails, review)** → GO3B1-01 status lifecycle + base-WAF change management.

Four of five steps are already discharged. BP01 is the Reliability-framed twin of GO3B1-01 (an Operational-Excellence standard); AWS restates under Reliability what the GO-family already mandates.

step_promotion score: **3/3/2/3 → not_promote.**

## The residual slice

GO3B1-01's row binds a **single** `model` and token budgets to a prompt. It does **not** bind:

1. a validated **sampling-hyperparameter range** (temperature / top_p / top_k) to a prompt version, nor
2. a **prompt × model-version compatibility / test-result matrix**.

This is genuinely absent — but it does not stand up a new standard. It splits:

- The **declaration** is a schema extension to GO3B1-01 (add the fields below).
- The **validation** ("validated against", "test results per model version") is GO1B1-01's eval harness doing the running — no new gate.

## Recommendation

Extend GO3B1-01's registry row schema with two optional fields, lint existence only (content validation stays with GO1B1-01):

- `hyperparameter_ranges` — per-prompt-version allowed ranges for `temperature`, `top_p`, `top_k` (and any other sampling knobs the SDK exposes); the central SDK rejects a call whose sampling params fall outside the declared range, the same way it already enforces token budget.
- `model_compatibility` — the set of catalogued model versions (GO1B1-06 catalog entries) a prompt version has been validated against, populated from GO1B1-01 harness results.

Both optional, both existence-linted in GO3B1-01's pre-merge lint; the "validated against" semantics ride GO1B1-01. No new principle, no new platform component — one schema bump to an existing standard.

## Consequences

- GENREL04-BP01 closes with no new standard.
- GO3B1-01 gains two optional fields when the schema-extension PR lands (not done in this walk — recommendation only; `principles.json` unchanged).
- mapping_state: BP01 verbatim **verified** (live page fetched 2026-06-23), unlike GENREL01/02.
