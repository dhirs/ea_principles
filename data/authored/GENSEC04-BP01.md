# GENSEC04-BP01

- **Key:** `GENSEC04-BP01`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENSEC04-BP01 (whole BP — "Implement a secure prompt catalog"; AWS verbatim fetched 2026-06-07, 6 steps, risk **Medium**) | not_promoted — no principle authored. GENSEC04 ("How do you secure system and user prompts?", focus area "Prompt security") ships two BPs (BP01 here; BP02 sanitize/validate inputs next). **User directed not_promote 2026-06-07.** The catalog itself (centralized, versioned prompt storage for reuse) is already owned by **GO3B1-01** (registered, versioned prompt templates via the central SDK). BP01's only addition is the "secure" wrapper — IAM least-privilege on prompt actions (CreatePromptVersion / GetPrompt), separation-of-duties roles — generic IAM access control (base WAF, the GENSEC01-BP01 shape already not_promoted) applied to the registry, plus the GO3B2-02 access-governance pattern. Steps are a Bedrock Prompt Management vendor walkthrough. Nothing GenAI-distinct and unowned survives. step_promotion would fail `architecturally_distinct` (GO3B1-01 owns the catalog) + `not_vendor_menu`. Legacy provisional "possibly PRIN_014" mapping resolved: the secure-catalog concern is GO3B1-01 + generic IAM, not a standalone principle.
