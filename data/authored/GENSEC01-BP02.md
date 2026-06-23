# GENSEC01-BP02

- **Key:** `GENSEC01-BP02`
- **Date:** 2026-06-07
- **Outcome:** not_promoted

---

- 2026-06-07 | GENSEC01-BP02 (whole BP — "Implement private network communication between foundation models and applications"; AWS verbatim fetched 2026-06-07, 3 steps, risk **High**) | not_promoted — no principle authored. BP mandate: scoped-down data perimeter on FM endpoints — AWS PrivateLink / VPC endpoints so apps reach Bedrock/Q/SageMaker without the public internet; self-hosted (SageMaker) endpoints in private VPCs with security groups/subnets; FMs reach supporting infra (vector stores, agent tools) privately too. **User directed not_promote 2026-06-07** after a HALT. Cleanest not_promote of the GENSEC batch: pure network security (PrivateLink, VPC endpoints, private subnets, security groups) owned by the base WAF Security pillar — AWS cross-references SEC05-BP01/02 (network protection). Three steps are generic VPC-endpoint setup (pick VPC → pick service → configure endpoint policy + security groups), identical for any AWS service, no GenAI-specific mechanism. Only GenAI-flavoured line ("FM reaches its vector store / agent tools privately too") is generic network perimeter applied to whatever infra a RAG/agent app uses; no GenAI-distinct enforceable artefact, nothing a sibling needs. step_promotion would fail `architecturally_distinct` (generic network security) + `has_enforceable_artefact`.
