# GENOPS03-BP01 step 1

- **Key:** `GENOPS03-BP01 step 1`
- **Date:** 2026-06-03
- **Outcome:** promoted → GO3B1-01

---

- 2026-06-03 | GENOPS03-BP01 step 1 (AWS verbatim "Set up Amazon Bedrock Prompt Management") | promoted_to_principle: GO3B1-01 — Route every model call through a registered, versioned prompt template via the central SDK. Absorbs step 4 (Integrate prompts into applications — use Bedrock SDK during inference); the SDK call-signature contract `(template_id, variables)` is mechanically inseparable from the registry — gate from step 1 only bites if step 4's call signature is enforced. Sibling to GO3B2-01 under P13 Traceability: GO3B2-01 owns the emission contract (observability SDK as the only emit path); GO3B1-01 owns the call-signature contract (LLM SDK refuses inline strings, accepts only template_id). step_promotion rubric 3/3/3/3 (specific path-shaped artefacts + content-shape gates; sibling distinction with disjoint artefacts; AWS placement BP-native since GENOPS03 question literally names prompts; vendor-menu language stripped, generic mandate survives). Solution is storage-neutral: Mode A (file-based + manifest at `prompts/manifest.yaml`) or Mode B (hosted TMS — Bedrock PM / Langfuse / PromptLayer / Humanloop / MLflow Prompt Registry). Three pre_merge gates (template_id ↔ registry consistency; no-inline-call AST lint; SDK version floor). ownership.tier enterprise via D1=no borderline / D2=3 → recommended_centralise. Substrate principle: GENCOST03-BP01 budget principle (currently paused) becomes shippable now — prompts/budgets.yaml has somewhere to point.
