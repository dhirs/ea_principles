# Next-Best-Offer — deep dive

Three angles: how the modelling evolved, how the economics work, and what an agent architecture actually looks like.

---

## 1. Modelling evolution

### Propensity / response models (the 2000s default)
Per-offer binary classifier: `P(redeem | customer, offer)`. Trained on historical send-and-redeem data with features like RFM, demographics, basket categories, and past offer engagement. Workflow: score everyone, send to the top-N highest-propensity customers.

**The fatal flaw:** these models are confounded. They learn *who buys*, not *who buys because of the offer*. So you systematically over-target "sure-thing" customers and pay margin to people who would have bought anyway.

### Uplift / causal / incrementality models
Estimate the *causal* effect per customer: `P(buy | offer) − P(buy | no offer)`. Requires a randomised holdout (industry standard 5–10%). Techniques include T-learner (separate models for treated and control), S-learner (treatment as a feature), X-learner, causal forests, and doubly-robust estimators.

Output partitions customers into four useful buckets:
- **Persuadables** — buy if offered, not if not. The gold.
- **Sure things** — buy either way. Discounting them is pure margin leak.
- **Lost causes** — won't buy either way. Wasted send.
- **Sleeping dogs / do-not-disturbs** — offer makes them *less* likely (e.g. reactivation email that prompts an unsubscribe).

Goal shifts from maximising redemption to maximising *incremental* margin. The hard part is signal-to-noise: effects are small, data is noisy, and you need disciplined holdouts to estimate them.

### Contextual bandits
Reframes the problem as sequential decision-making under uncertainty. Each customer interaction is a round: observe context → choose an arm (offer) → receive reward. Algorithms: epsilon-greedy, Thompson sampling, LinUCB, neural bandits.

Solves the explore–exploit problem: how do you learn whether a new offer works without burning a fortune testing it? Handles cold-start for new offers and customers naturally. Off-policy evaluation (IPS, doubly-robust) lets you test new policies on logged data before deploying. Still myopic, though — each round optimised independently, no reasoning about long sequences.

### Full RL / sequential lifecycle models
Treats the whole customer journey as an MDP, actions across weeks/months, reward = LTV. Almost nobody runs this in production retail — rewards too sparse, episodes too long, off-policy data too confounded.

### Agent layer
Doesn't replace the above — sits on top. The decision used to be: ranking model emits a (customer, offer) ordering → ESP sends.

Now: a tool-using LLM with access to uplift scores, customer profile, offer catalogue, inventory, channel state, and brand rules. It produces a structured decision *plus* the generated creative. Useful for encoding business rules in natural language, handling edge cases, generating channel-appropriate copy, and explaining decisions to marketers.

In serious retail, pure end-to-end agent NBO is still rare. The mature pattern is: deterministic uplift models do the ranking; the agent does the orchestration, the reasoning over constraints, and the copy.

---

## 2. Business and economics

### Margin math
`Incremental margin = (incremental units × unit margin) − offer cost − send cost`

Without uplift modelling you systematically overpay, because most redemptions come from sure-things. A toy example: 10% off bread to 1M customers, 200k redeem. Looks like a hit. Uplift analysis says 20k were genuinely persuaded; the other 180k would have bought bread anyway. You just funded a discount for 180k people for no incremental volume. The campaign destroys margin.

### Measuring incrementality
- **Gold standard:** randomised holdout / control group. 5–10% of qualifying customers get no offer; measure the gap.
- **Tier 2:** matched control (propensity score matching, synthetic control) when randomisation isn't possible.
- **Tier 3:** difference-in-differences across regions or time windows.

Common metrics: ROAS, incremental ROAS, incremental margin, payback period, frequency-adjusted LTV lift.

Watch-outs: novelty effects, cross-category cannibalisation (premium bread offer cannibalising own-label), pull-forward (would have bought next week anyway), seasonal confounding.

### Frequency and fatigue
Every send has hidden cost: unsubscribe rate, email-deliverability reputation, push-permission revocation. Mature teams model fatigue as a regularisation term in the optimisation, plus hard "pressure rules" (max N comms per customer per week) as a constraint over model output.

### Short-term vs long-term
A redemption-rate KPI is the easiest way to destroy a loyalty programme. Mature teams report on incrementality and CLV impact. Hard because CLV lift is slow, noisy, and shows up quarters later — making it hard to defend against short-term promo budgets that move next-week sales.

### Org politics
Margin sits with finance; promo budget with category/trading; the CRM and offer engine with customer/loyalty marketing; data science cross-cuts. Recurring fight: trading wants the discount to clear stock, marketing wants it on persuadables, finance asks why iROI is negative. NBO programmes succeed or fail on whether these three are aligned on the metric.

---

## 3. Agent architecture

A realistic NBO agent stack:

### Inputs
- Customer profile: segment, LTV, lifecycle stage, channel prefs, consent flags
- Recent behaviour stream: last N baskets, browse, opens/clicks
- Eligible offer catalogue from trading: margin, budget, expiry, restrictions
- Inventory and supply signal — push offers on items you actually have
- Brand and legal guardrails: HFSS rules, claims policy, banned combinations
- Business goals for the period (e.g. "drive premium-tier sign-ups in Q3")

### Underlying ML services (the agent calls these, doesn't replace them)
- Uplift scoring API: per (customer, offer) returns incremental purchase probability
- Propensity / next-product model: what they're likely to buy next
- Churn / lapse model
- Send-time and channel-preference model

### Agent core (LLM with tools)
- Reads customer state via tools (CRM lookup, transaction history, current offer rotation)
- Calls uplift API to score candidate offers
- Applies business rules and constraints (frequency caps, exclusion lists, legal)
- Decides offer + channel + send time + framing
- Generates the creative (subject line, body, CTA) consistent with the brand guide
- Emits structured output: `{customer_id, offer_id, channel, send_at, creative_variant_id, reasoning_trace}`

### Orchestration
Batched runs (e.g. nightly for the next-day email batch) or near-real-time on triggers (cart abandonment, lapse threshold). Every decision logged with the reasoning trace and the scores the agent saw — required for the test harness and for audit. Human-in-loop for high-stakes segments (top-LTV, complaint history, vulnerability flags).

### Test harness layer
- **Offline:** replay historical contexts, compare agent decisions against previous policy via off-policy evaluation (IPS, doubly-robust).
- **Online:** 5–10% always-randomised holdout; periodic A/B between agent policy and previous champion policy.
- **Guardrail metrics:** unsubscribe rate, complaint rate, margin per send, frequency-cap violations.
- **LLM-specific evals:** brand-voice score, factual accuracy on offer details (price, expiry, eligibility), banned-claim detection, refusal correctness on out-of-scope requests.

### Why an agent rather than a deterministic pipeline
- Business rules in natural language ("be gentler with bereavement-flagged customers")
- Explainable decisions — useful for marketer trust and complaint handling
- Easy to extend with new offer types without retraining the whole stack
- The creative generation needs an LLM anyway; coupling it with the decision reduces the "right offer, wrong copy" failure mode

### Why be careful
- LLM in the critical path adds latency and cost (millions of decisions per day)
- Non-determinism makes A/B testing harder
- Failure modes are unusual: prompt injection from customer-supplied profile fields, hallucinated offer terms, drifting brand voice
- Current best practice: agent for orchestration + reasoning + copy; deterministic uplift for the ranking; log everything; treat the agent as one component, not the whole system.
