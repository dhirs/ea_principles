# GENPERF01-BP01

- **Key:** `GENPERF01-BP01`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENPERF01-BP01 (whole BP — "Define a ground truth data set of prompts and responses"; AWS verbatim fetched 2026-06-07, 5 steps, risk **Medium**) | not_promoted / absorbed by the GO1B1 eval-harness family. GENPERF01 ("How do you capture and improve the performance of your generative AI models in production?", focus area "Establish performance evaluation processes") ships two BPs; both not_promoted (see next entry). BP01 mandates a curated golden dataset of prompt–response pairs, stored for dictionary-style lookup (S3 + Glue Crawler data dictionary), fed to a testing harness (Athena federated query, mock data for RAG/agents) that auto-evaluates models as they appear; treat the dataset as a living artifact. **User directed not_promote 2026-06-07.** This is the same artefact our **GO1B1-01** (ground-truth eval dataset) was authored from at GENOPS01-BP01 — a golden set of prompt–response pairs + a harness that evaluates any model against it. The lens_mapping had provisionally hoped GENPERF01-BP01 was "performance/latency-focused, distinct from GENOPS01-BP01", but the verbatim is not about latency — it is task/response-quality evaluation over the same prompt–response golden dataset, run through the same harness GO1B1-01/02/03 mandate, with the "living artifact" line = GO1B1-05's refresh discipline. Same dataset viewed through the performance lens; nothing architecturally distinct survives. step_promotion would fail architecturally_distinct (redundant with GO1B1-01..03/05) — the dataset is one artefact evaluated for both functional correctness (GENOPS01) and performance-task quality (GENPERF01). Substance fully owned by the GO1B1 family.
