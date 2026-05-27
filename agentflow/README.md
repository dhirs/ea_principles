# agentflow

Code for the LangGraph pipeline that authors principles for the catalogue in sibling folder `ai_principles/`.

## Separation rule

All agent / pipeline / node / prompt / test code lives in this folder. None of it lives in `ai_principles/`.

Conversely, the catalogue files — `taxonomy.json` (schema spec), `principles.json` (the catalogue itself), `lens_mapping.md` (per-BP ledger), `decisions.md` (journal), `principles_old.json` (legacy reference) — live in `ai_principles/`. Nothing in this folder keeps its own copy.

The pipeline reads schema and AWS Lens BP source material, and writes new principle entries plus lens-mapping and journal updates back into `ai_principles/`.

Dependency direction is one-way: `agentflow → ai_principles`. The catalogue folder does not depend on this one.
