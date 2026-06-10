# Enforcement limits — where a lint can only do so much

> Created 2026-06-07 during the GENSEC01-BP03 → GS1B3-01 walk, when the user asked us to record, as a first-class cross-cutting note, the recurring pattern that **a static gate enforces plumbing, not correctness — and without developer discipline the system fails anyway.**

This file records a theme that runs through the whole catalogue. Read it alongside `taxonomy.json` (the `ownership_spec` / `gates_spec` / `evidence_spec` blocks) and the per-principle `solution.approach` notes. It is not a principle and does not appear in `principles.json`; it is a design honesty note for authors and adopters.

## The pattern

Every CI gate in this catalogue can verify that an artefact **exists**, that it has the right **shape**, and that it is **wired in** to the code path. What no static gate can verify is whether the **values a human supplied are correct**. A lint can prove a field is present and populated; it cannot prove the populated value is true. Past the wiring, the system depends on developer discipline — and where that discipline lapses, the gate stays green while the system fails anyway.

This is not a flaw to be fixed by a better lint. It is the boundary of what static, pre-merge enforcement can do. The catalogue's stance is to be explicit about it: gate the plumbing mechanically, name the residual human-judgment gap in the open, and — where the gap carries real exposure — back it with a periodic human review rather than pretending CI closed it.

The shape recurs as three honest limits:

- **Existence/shape, not correctness.** A lint checks a label is present; it cannot check the label is right.
- **Wired-in, not runtime behaviour.** A lint checks a ceiling is bound into the construction; it cannot prove the running system halts at exactly that ceiling under live load.
- **Declared, not real.** A lint checks a declaration matches deployed config at merge time; it cannot prevent a human declaring a number that was never the right number.

## Worked cases across the catalogue

- **GS1B3-02 (RAG ingestion sanitisation).** The gates prove a sanitisation manifest is declared (exclusion classes + detector + action + threshold), that every data-card-prohibited class is screened or explicitly waived, that no code writes to the vector store except through the ingestion SDK, and that every run leaves an audit record. **What they cannot prove:** that a detector actually catches a given piece of PII — a vacuous detector that flags nothing passes every lint, and masking with a sloppy pattern leaves variants through. Detector recall is a runtime property against real content, so efficacy is handed to the quarterly seeded-PII audit (canary documents with planted sensitive content through a test ingestion, leak-rate vs the declared threshold), which is a binding acceptance criterion, not an optional extra.

- **GS6B1-01 (training-data purification).** The gates prove a purification manifest is declared (categories + filter + threshold + on_flag), that every policy-required poison category is screened or explicitly waived, that no training/customization job consumes a raw source, and that every run leaves an audit record. **What they cannot prove:** that a filter actually catches poison — a vacuous filter that flags nothing passes every lint, and a threshold set absurdly high screens in name only. Filter recall is a runtime property of the filter against real poison, so efficacy is handed to the quarterly seeded-poison audit (a canary corpus of known-poisonous samples salted into a test run, catch-rate vs the declared threshold), which is a binding acceptance criterion, not an optional extra.

- **GS1B3-01 (RAG retrieval-time access control).** The gate forces every document to carry an `acl` label at ingestion and forces all retrieval through the central retrieval SDK that applies an identity-scoped filter. **What it cannot do:** verify the label is *correct*. A confidential Finance document ingested with `acl: ["public"]` is faithfully served to everyone — the SDK enforces the wrong label perfectly. The schema lint catches a *missing* label, never a *wrong* one. This is why GS1B3-01 pairs its mechanical pre-merge gates with a periodic security review that samples ingested labels against the source-system classification: the part the lint cannot reach is handed to a human on purpose, not wished away.

- **GC5B1-01 (agent hard stop).** The gate proves a run-limit ceiling is declared and structurally bound into the agent's construction (LangGraph `recursion_limit`, CrewAI `max_iter`, etc.). **What it cannot do:** prove the agent actually halts at the budget under live load — that is runtime behaviour. Option B (a runtime circuit-breaker) exists precisely because the static gate stops at "wired in."

- **GC2B2-01 (right-size hosting).** The code-vs-record lint proves the deployed IaC matches the declared right-sizing baseline. **What it cannot do:** prove the declared baseline is the *right* baseline — a human still has to choose utilization targets that reflect reality.

- **GC4B1-01 (embedding dimension).** The lint proves the deployed index dimension matches the declared dimension and that a quality number is recorded. **What it cannot do:** re-run retrieval evaluation to prove the recorded quality number is honest — it checks that a number exists and the index is real, not that the number was measured rigorously.

- **GO3B1-01 (prompt registry) / GO1B1-06 (model catalog).** The AST lint proves no inline/direct model call bypasses the registry, and the membership lint proves the model identifier is in the catalog. **What it cannot do:** prevent a human registering a bad prompt or catalog entry — it enforces the route, not the wisdom of what travels it.

- **GS5B1-01 (agent action gate).** The lints prove every tool is declared with a `scope` and `class`, that no tool is reached except through the central wrapper (so reachable = declared), and that every write tool is wired to a gate (`confirm` / `policy:<name>`, with unattended writes forced onto a policy). **What it cannot do:** prove the `class` is *honest* (a write mislabeled `read` sails through and fires unconfirmed) or the `scope` *minimal* (an over-broad execution role passes the build). This is the existence/shape-not-correctness limit on the action plane — the lint enforces that consequential tools are routed and gated, never that the human classified and scoped them truthfully. Hence the quarterly agent red-team + blast-radius review: drive the agent toward out-of-scope and unconfirmed actions and review classifications/scopes by hand, the part the lint cannot reach.

- **The `audit_mode` field itself.** `self_attestation_with_mechanical_evidence` is the catalogue's standard precisely because CI is the proof for the *mechanical* part. The principles whose residual human-judgment gap carries legal or safety exposure escalate to `central_review_at_gate` (GS1B3-01 is the first), where a named validator inspects the artefacts the lint cannot judge.

## The rule for authors

When authoring a principle:

1. Gate everything that is mechanically gateable — existence, shape, wired-in consistency, deployed-vs-declared — as required status checks.
2. Name the residual gap explicitly in `solution.approach` and (where it matters) in `statement.description`: state plainly what the gate does NOT prove and that correct operation still depends on developers supplying correct data.
3. Where the residual gap carries real exposure (legal, safety, cross-tenant data), do not leave it to faith — back it with a periodic human review gate (`quarterly_review` / `release`) and set `audit_mode: central_review_at_gate` with the artefacts the validator inspects listed in `evidence`.

A gate that pretends to close a gap it cannot close is worse than an honest gate plus a named human control: the first breeds false confidence, the second tells the adopter exactly where their own discipline still carries the system.
