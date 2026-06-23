# ADR — Managing foundation-model throughput quotas across projects

- **Status:** Accepted
- **Date:** 2026-06-22
- **Context source:** AWS Well-Architected GenAI Lens GENREL01 (Manage throughput quotas), BP01 "Scale and balance foundation model throughput as a function of utilization"
- **Catalogue decision:** GENREL01-BP01 **not_promoted** — no distinct, enforceable, AI-specific principle survives. This ADR records the recommendation we give projects instead.

## Problem

Foundation-model APIs cap how many requests/tokens you can send per minute. Exceed the cap and calls are rejected (HTTP 429). On Amazon Bedrock that quota is **per account/region** — shared by every workload on the account. One workload's traffic spike eats the shared quota and throttles unrelated workloads. Multiple API keys in the same account do **not** split the quota (Bedrock quotas are account-scoped, not key-scoped).

## Why no principle

The only thing a repo-level CI gate could enforce is a client-side rate limiter, and that doesn't protect a *shared* quota: a local limiter runs per process, so N instances each capped at X still sum to N·X. Real enforcement of a shared ceiling needs a global rate-limiting gateway with shared state — a parallel backend the org is unlikely to build, and per-client quota allocation is an operational/political problem, not an architectural one.

The substance lands on three things we already cover or that sit outside the catalogue:

- Throttling recovery (retry-with-backoff on 429) → **GR3B1-01** (Recover gracefully when a model call goes wrong).
- Cross-region throughput balancing → **GENREL05-BP01** (load-balance inference across regions).
- Provisioned-vs-on-demand capacity (a cost/buy decision) → adjacent to **GC2B2-01** (hosting right-sizing); not a gate.
- Account isolation → generic multi-account landing-zone governance (base-WAF), not AI-specific.

step_promotion score: 3/3/3/3 → not_promote.

## Recommendation

For a portfolio of projects on mixed providers (Bedrock, Anthropic, OpenAI, …):

1. **Isolate by default.** Each project owns its own provider account/key with its own quota and bill. Bedrock project → its own AWS account; OpenAI/Anthropic project → its own org/key. Separate quotas mean one project cannot throttle another, and billing is per-project for free. This removes the bad-apple problem without any central infrastructure.

2. **Reserve capacity for critical, steady traffic.** Bedrock → Provisioned Throughput (SLA-backed, eliminates rate-limit errors within the reserved amount, spillover to on-demand). Anthropic/OpenAI → committed/scale tier. Bursty or light traffic stays on on-demand and accepts best-effort.

3. **Each project stays under its own ceiling.** Client-side rate limit + retry-with-exponential-backoff on 429, owned inside the app. This is the GR3B1-01 recovery layer applied to throttling.

4. **Do not pool quota or build a central gateway.** Only worth it if you deliberately want cross-project sharing — and separate accounts give isolation for free, so don't.

5. **Central team provides a standard, not a backend.** Every project declares, through the shared SDK: provider, capacity mode (on-demand vs reserved), and rate-limit/backoff config. Quota-consumption monitoring rides existing telemetry (GO3B2-01).

**One line per project:** own account/key, reserved capacity if it's critical, backoff if it's not.

## Consequences

- No new catalogue principle, no new platform component to build.
- Cross-project quota fairness is solved by account isolation, not by a gateway.
- If a future need for genuine cross-project quota sharing appears, revisit — that would justify a global gateway and reopen the promote question.
