# July 2 — Interactive Skepticism Discussions

**What this is:** the design rationale for how we run Part 1 as a live, interactive exercise rather than
a lecture. We hand the audience a skeptic's objection for each use case, let them argue it out, and
steer them to a shared conclusion. Three use cases, same method.

---

## Why we do it this way

The intro deck (June) sells the *intent*: enterprise AI fails after the demo, and enforceable standards
fix it. A passive audience nods. A skeptical one doesn't — and the skeptical ones are the people who
actually decide whether this gets adopted at their company.

So Part 1 doesn't *defend* the standards. It hands the room the **strongest objection** to each one and
makes them work through it themselves. People believe a conclusion they argued their way to far more
than one they were told. By the end, the room has *agreed* — out loud — that the objection is real but
that it argues for fixing the process, not abandoning the control. That agreement is the conversion.

The deeper thesis we're driving them toward: **the failure is fractal.** The same root cause — a
cross-cutting concern that nobody owns and nothing enforces — repeats at every scale (demo→production,
project→enterprise, process→rollout). Every objection they raise turns out to be that same failure one
level up. Their best attack becomes our closing argument.

---

## The template every objection follows

Each use case carries one or more objections, each captured in three parts (see
`legal_grounding.md` for the worked version):

1. **The concern** — the skeptic's actual argument, in their voice. Sharp, not a strawman.
2. **What should be fixed** — the process change that genuinely answers it. (Almost always: ownership,
   recourse/escalation, or measurement — not "try harder.")
3. **If central control is dropped because the fix is hard** — what you lose by walking away instead.
   This is the section that lands the value: the hard part *was* the value.

The reframe we land every time: *every objection is an argument to fix the implementation, not abandon
the intent.*

---

## How we run it live (per use case)

1. **Set the scene** — give the audience the scenario and the fix as if it's settled. Let them get
   comfortable that the problem is solved.
2. **Drop the objection** — read the skeptic's concern. Ask the room directly: *"He's right, isn't he?
   What do you actually do here?"*
3. **Let them argue** — surface the two tempting-but-wrong answers themselves (e.g. "just wait" vs
   "just let people override"). Don't supply them; let the room reach for them.
4. **Converge** — guide them to the process fix, and get an explicit show-of-hands agreement that it's
   the right call.
5. **Land the cost** — ask the closing question: *"And if that fix is too hard, do we drop the control?"*
   Walk them through what returns when you do. Everyone agrees you can't.

The goal each round: a room that has **collectively agreed on the outcome**, not been told it.

---

## Timing

- **1 use case = 30 minutes**, holding **3 scenarios at 10 minutes each.**
- **3 use cases × 30 min = 90-minute Part 1.**

Each 10-minute scenario runs: set the scene (2) → drop the objection and let the room argue (5) →
converge on the fix (2) → land the cost of dropping the control (1). Tight by design — keep it moving.

---

## The three use cases

We run the same method across all three Part-1 failure dimensions. Each gets its own register file.

| Use case | File | Dimension | Skeptic energy |
|---|---|---|---|
| **Eval harness** | `ce_harness.md` | Customer Experience (CE) | "It's just testing 101 — and the golden set goes stale." |
| **Grounding gate** | `legal_grounding.md` | Legal & Risk (Legal) | "Your gate gets routed around." |
| **Caching** | `cost_caching.md` | Cost | "This is a one-line config flag — why a whole team?" |

Each file holds multiple objections built to the template above. Grounding is done and is the worked
reference for the other two.

---

## Build status
- [x] Harness — register written, 3 scenarios (stale set · "just testing" · slow metered gate)
- [x] Grounding — register written, 3 scenarios (routed around · wiring isn't efficacy · grounded isn't true)
- [x] Caching — register written, 3 challenges (prefix isn't static · "just a flag" · freeze-the-wrong-thing)

**All three use cases complete — Part 1 fully built (3 × 30 min = 90 min).**

Spin-off flagged during the grounding role-play (Ex 3): a **retrieval-corpus / knowledge-base
governance** standard — freshness, versioning, source-of-truth ownership of the document store —
separate from GS2B1-01. The grounding gate proves faithful-to-source; this would own whether the source
is true. Candidate for a future BP walk, not a Part-1 use case.
