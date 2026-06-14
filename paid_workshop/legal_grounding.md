# July 2 Workshop — Use Case: The Grounding Gate (Skepticism Register)

**Part 1 use case · Failure category: Legal & Risk (Legal)**
**Maps to:** GENSEC02-BP01 → GS2B1-01 (output grounding gate)

> This document captures the **skeptic's objections** to the grounding standard — the kind a senior
> developer throws at you in the room. A use case has **multiple** such objections. Each follows one
> template:
>
> - **The concern** — what the skeptic actually argues.
> - **What should be fixed** — the process change that genuinely answers the concern.
> - **If central control is dropped because the fix is hard** — what you lose by walking away instead.
>
> The point of the register: every objection is an argument to *fix the process*, never to abandon the
> control. Siblings: `ce_harness.md`, `cost_caching.md`.

---

## Example 1 — "Your gate will just get routed around"

### The concern
The senior dev: "You've put a required grounding check, written by a central team, in front of my
deploy. The day it false-positives — blocks a release that's actually fine — my only path is to raise
a ticket and wait. It's Friday 4pm. So my team learns the fast move: `--no-verify`, mark it
non-blocking, dodge it. Your gate doesn't get respected, it gets routed around — quietly. Now you've
got a green dashboard and zero real enforcement. Why should I accept a gate I don't own that slows me
down and that everyone will defeat within a month?"

### What should be fixed
The concern is real and it's about **latency of recourse**, not the gate itself. Fix the process around
the gate:
- A **break-glass path**: the project architect can override *now*, with an auto-logged justification
  that governance reviews after the fact — so a false positive never costs a weekend.
- **Risk-tiered gates**: convenience checks (cost, caching) allow self-serve override; high-risk checks
  (grounding, safety, legal) stay hard-blocked but get an **SLA'd urgent-review channel** so "raise a
  ticket" means minutes, not Monday.
- **Clear ownership** of the scorer and its threshold, so false positives get fixed at source instead
  of dodged repeatedly.

Done right, dodging the gate is no longer the only fast path — so the gate keeps its teeth *and* the
dev stays onside.

### If central control is dropped because the fix is hard
Building proper escalation is real work — SLAs, ownership, an override audit trail. The tempting move
is to say "this is too much friction, let teams self-govern." That throws away the protection to avoid
the effort. With no central control, grounding exists only where a strong architect happens to build it;
the insurer's team — rewarded on shipping, not on safety — never adds it; the **confident fabrication
returns** and ships to customers. You didn't remove friction, you removed the only thing standing
between the bot and the next abroad-cover screenshot. The hard part *was* the value.

---

## The reframe (say this in the room)

Every objection in this register is legitimate — and every one is an argument to **fix the
implementation, not abandon the intent.** A faulty process fails in two directions (dodged, or it
blocks the wrong things); the answer to both is a better-owned process, not less control. Caving
because the fix is difficult is the same failure one level up — demo→production, project→enterprise,
process→rollout: no owner, no enforcement, invisible until it's expensive.

## Facilitator notes
- Run it live: assume green CI, reveal the 4/200 false positive, ask "what do you do at 4pm?" *before*
  offering the answer. Most reach for `--no-verify` — that's the lesson.
- Prompts: What's your org's actual SLA on an urgent override today (usually: none)? Who owns the
  scorer's threshold? Which gates are genuinely high-risk vs. convenience checks?
