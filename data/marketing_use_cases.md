# Marketing Use Cases — Customer & Loyalty (Waitrose-type grocer)

Top 5 agent/LLM use cases that need a ground truth and a test harness.

## 1. Next-best-offer / next-best-action agent
Picks which myWaitrose offer, recipe, or product nudge to send each customer.
- **Ground truth:** historical conversions, holdout/control groups.
- **Test harness:** backtests on held-out customer journeys, uplift vs control, guardrails on margin and frequency caps.

## 2. Churn / lapse prediction with LLM reasoning
Flags at-risk loyalty members from CRM + basket history and proposes a retention play.
- **Ground truth:** actual lapse outcomes in past time windows.
- **Test harness:** precision / recall / AUC on held-out cohorts, calibration checks, fairness across segments.

## 3. Personalised lifecycle content generation
LLM writes email subject lines, push copy, body copy, and product picks per segment.
- **Ground truth:** brand voice guide, product catalogue (price, availability, allergens, claims), legal / ASA rules.
- **Test harness:** automated evals for hallucinated facts, brand-voice scoring, banned-claims regex; then live A/B on open / click / revenue.

## 4. Loyalty support agent
Tool-using LLM handling myWaitrose queries: points balance, missing rewards, partner offers, account fixes.
- **Ground truth:** canonical policy answers + correct account-data lookups.
- **Test harness:** golden Q&A set, tool-call accuracy, escalation-correctness, refusal / PII tests.

## 5. Natural-language audience / segment builder
Marketer types "lapsed organic-veg buyers in London, no shop in 8 weeks"; agent emits the SQL or segment spec.
- **Ground truth:** hand-labelled NL→segment pairs with expected customer-ID sets.
- **Test harness:** Jaccard / F1 between predicted and expected cohorts, plus SQL static checks.
