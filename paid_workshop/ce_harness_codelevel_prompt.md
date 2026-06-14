# Prompt — Understand the Eval Harness at the Code Level

> Paste everything below the line into a fresh chat. It's self-contained. I'll then go deeper with you
> section by section.

---

I'm building an enterprise AI architecture workshop. One of my standards (GENOPS01-BP01 → GO1B1-01)
says: **commit a versioned, team-runnable eval harness (a "golden set") to the repo and wire it as a
required CI status check / pre-commit hook**, so every PR replays production-realistic and adversarial
cases and a regression **fails the build** before it reaches production.

The motivating scenario: a **Returns Triage Agent** at a UK retailer reads a customer's free-text
return reason ("don't fit lol the size was wierd"), pulls the order, checks payment status / prior
returns / clearance, applies policy, and outputs one of **AUTO_APPROVE / HUMAN_REVIEW / REJECT**. A
release silently started issuing wrong decisions — legitimate returns rejected, a surge of unexpected
refunds. CI was green because the tests only covered happy paths. The senior architect's 50+
hand-validated production forms were never committed; the harness left with him when he did.

I understand the *concept*. I now need to understand it **at the code level**. Build it up incrementally
with runnable examples — I'd rather see real code and file layouts than prose. Go section by section and
check in with me before moving on:

1. **What a golden set actually is** — as files and code. What format (e.g. JSONL of input + expected
   decision + rationale + tags)? Show a handful of realistic records for the returns agent, including
   a couple of adversarial / edge cases.
2. **The runner** — how code loads the golden set, calls the agent on each case, and compares output to
   expected. Show the core loop.
3. **Scoring & assertions** — the agent is an LLM and non-deterministic. How do you assert "correct"
   without flaky failures? Exact-match on the decision label vs judge-based / semantic scoring; pass
   thresholds; per-case vs aggregate metrics (accuracy, false-approve rate). Show how a threshold gate
   decides pass/fail.
4. **Wiring it as a gate** — how the same harness runs as (a) a fast pre-commit / PR required status
   check on a smoke subset, and (b) a full nightly / release-branch run. Show the CI config and the
   **exit-code contract** that actually fails the build.
5. **The standardised interface** — how a *central* SDK could trigger any project's harness without
   owning its test data. What contract does the project implement (e.g. a `run_evals()` entrypoint, a
   manifest, an expected output schema)? Show the interface.
6. **Refreshing the golden set** — how new cases get added/relabelled over time, how the set is
   versioned, and how an *independent* reviewer stays in the loop so a dev can't bless their own change.
7. **The failure replayed** — show concretely how an uncommitted / happy-path-only harness lets the
   regression through, and how the committed golden set would have caught it at PR time.

Assume a **Python** harness (most common for evals); note where a **TypeScript / Next.js** setup would
differ. Keep it concrete and runnable.
