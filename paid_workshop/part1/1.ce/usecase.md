# Use Case — The Eval Harness

**Category:** Customer Experience
**Standard:** GO1B1-01 (committed, gated eval harness / golden set)

## The client
An e-commerce retailer (illustrative — a mid-to-large online store doing high return volumes). Returns are a major cost and CX pain point: too lenient and the business eats fraud and abuse; too strict and good customers get angry and churn. The retailer built an AI agent to take the manual grind out of triaging return requests.

## The agent and what it's trying to do
The **Returns Triage Agent** processes roughly **2,000 return requests a day**. For each one it reads the customer's free-text reason ("arrived damaged", "wrong size", "changed my mind", "never arrived") alongside the order, payment, customer, and item data, and decides one of three actions:

- **AUTO_APPROVE** — clear-cut, low-risk return; refund/replacement goes through with no human.
- **HUMAN_REVIEW** — ambiguous, high-value, or suspicious; routed to a human agent.
- **REJECT** — outside policy (e.g. past the return window, non-returnable item).

The goal is to **auto-clear the easy majority** so human agents only touch the genuinely hard cases — cutting handling cost and giving customers an instant answer, while keeping fraud and policy violations in check. Getting the decision right is the whole point: a wrong AUTO_APPROVE leaks money, a wrong REJECT burns a good customer.

## What went wrong
A release **silently shipped wrong decisions**. CI was green — but it only ran happy-path tests that checked the agent *responded*, not that it *decided correctly*. The one thing that actually measured decision quality was a set of **50+ return forms the architect had hand-labelled** with the correct call. Those were never committed to the repo — they lived on his laptop. When he left, the harness left with him. From that point on, nobody could tell a good decision from a bad one until customers (or Finance) complained.

## The fix
Commit a **versioned, team-runnable golden set** — those labelled cases, owned by the team and stored in the repo, not one person's head — and wire it as a **required CI status check**. Every change must run against the golden set and pass before it can ship, so a decision regression turns the build **red** instead of reaching customers. The harness becomes a shared, enforced asset instead of one expert's private safety net.
