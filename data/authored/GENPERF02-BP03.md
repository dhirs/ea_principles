# GENPERF02-BP03

- **Key:** `GENPERF02-BP03`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENPERF02-BP03 (whole BP — "Select and customize the appropriate model for your use case"; AWS verbatim fetched 2026-06-07, 7 steps, risk **Medium**) | not_promoted / absorbed. This is model selection framed for performance: test candidate models (family/size, multiple providers) against a ground-truth + adversarial-prompt suite, pick the best on average, document the choice in a per-workload "AI usage document", re-test as new models arrive; optionally elevate via Bedrock Prompt Routing, fine-tuning, continuous pre-training, or distillation (7 steps). It is the performance-framed twin of **GC1B1-01** (the "AI usage document" IS GC1B1-01's model-selection ADR), riding on the **GO1B1 eval-harness family** (test against ground truth) and **GO1B1-06** (re-test the leading model on new-model availability). The routing / fine-tuning / continuous-pre-training / distillation options are a vendor + technique menu (`not_vendor_menu`). Nothing architecturally distinct survives for the performance pillar that GC1B1-01 + the GO1B1 family do not already own. **User directed not_promote 2026-06-07.** step_promotion would fail architecturally_distinct (redundant with GC1B1-01 + GO1B1) + not_vendor_menu (routing/customization menu). **GENPERF02 focus area CLOSED** (three BPs, all not_promoted).
