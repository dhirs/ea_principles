# GENSEC04-BP02

- **Key:** `GENSEC04-BP02`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENSEC04-BP02 (whole BP — "Sanitize and validate user inputs to foundation models"; AWS verbatim fetched 2026-06-07, 5 steps, risk **High**) | not_promoted (user-deferred) — no principle authored. The input-side prompt-injection defence deferred from GS2B1-01. BP mandate: an abstraction layer validating/sanitizing user input before the model (injection detection via keywords / guardrail / LLM-as-a-judge), context boundaries delimiting untrusted input in the template, size/rate limits. **Presented as a legitimate promote candidate** (sibling to GS2B1-01 input side: input-validation guardrail on every user-influenced prompt before the model, untrusted-input context boundaries in the GO3B1-01 template, size/rate limits, wrap-route-lint enforcement + red-team for efficacy — GenAI-distinct since injection is LLM-specific, unowned since GS2B1-01 is output-side). **User directed "ignore" 2026-06-07** — deferred by choice, NOT a structural not_promote. Live candidate: author later as an input-side sibling to GS2B1-01 (mirroring AWS's GENSEC02-output / GENSEC04-input split) or fold into GS2B1-01 as an input+output guardrail. **GENSEC04 CLOSED** (BP01 not_promoted → GO3B1-01 + generic IAM; BP02 not_promoted/deferred).
