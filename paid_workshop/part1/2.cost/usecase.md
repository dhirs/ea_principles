# Use Case — Governed Prompt Caching (Background)

**Category:** Cost
**Standard:** GC3B3-01 · AWS Generative AI Lens GENCOST03-BP03

## The client
A large UK life & pensions insurer (illustrative — not based on any specific company). Scale: ~12M customers, ~£280bn assets under administration, 7,500–10,000 staff, across several consumer brands. The business is heavily document- and contact-driven, which makes it a near-ideal GenAI footprint. Estimated LLM spend is ~$0.7M/year in the base case (plausibly $150k at pilot scale up to several million on a broad rollout) — figures are illustrative only.

## What the AI does
A **contact-centre support agent** ("agent assist") that helps human advisors handle customer conversations — roughly **12,000 conversations a day**. On each turn it drafts a reply, summarises the case, classifies the query, and retrieves the relevant policy and product information for the advisor. The goal is to cut handling time and keep answers consistent and accurate across thousands of advisors.

## The cost shape (why this is a Cost case)
Every model call carries a big **static prefix** — the system prompt, tool definitions, few-shot examples, and retrieved policy context — often **~8k tokens** — against a tiny variable question. Input tokens dominate the bill (~75–80% of cost). That static prefix is the single biggest cost lever in the whole system, which is exactly what the prompt-caching standard (GC3B3-01) targets: cache the unchanging prefix so it bills at a fraction instead of full price on every call.
