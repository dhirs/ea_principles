# Use Case — The Grounding Gate (Background)

**Category:** Legal & Risk
**Standard:** GS2B1-01 · AWS Generative AI Lens GENSEC02-BP01

## The client
A large UK life & pensions insurer (illustrative — not based on any specific company). Same organisation as the other Part 1 cases: ~12M customers, ~£280bn assets under administration, heavily document- and contact-driven. Its products are governed by policy wordings, terms and regulatory rules — so what it *tells* a customer about their cover is a legal and regulatory matter, not just a support nicety.

## What the AI does
A **RAG policy-support bot** that answers customer questions about their cover. "RAG" = retrieval-augmented generation: for each question it first **retrieves** the relevant passages from the insurer's document store (policy wordings, product terms, FAQs), then asks the model to **generate** an answer grounded in those passages. It handles routine questions — "is dental included?", "am I covered abroad?", "what's my excess?" — so customers get an instant, accurate answer instead of waiting for an advisor.

## Why this is a Legal & Risk case
The bot's answers are effectively **statements about a customer's contract**. If it says something the policy doesn't support, the business may be **liable to honour it**, or has mis-stated cover to a customer — a regulatory and legal exposure, not just a bad experience. The danger with RAG is a **fabricated (hallucinated) answer**: the model produces a fluent, confident reply that *isn't* supported by the retrieved documents. Asked about travel cover, it states cover applies abroad — when the policy says no. It looks authoritative and is completely wrong. That single sentence is the risk this use case exists to contain.
