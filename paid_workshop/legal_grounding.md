# July 2 Workshop — Use Case: The Grounding Gate (Skepticism Register)

**Part 1 use case · Failure category: Legal & Risk (Legal)**
**Maps to:** GENSEC02-BP01 → GS2B1-01 (output grounding gate)

> Same template as the harness and caching registers. Three objections, each captured as **The
> concern · What should be fixed · If central control is dropped because the fix is hard.** Every
> objection argues for fixing the process, not abandoning the control. Siblings: `ce_harness.md`,
> `cost_caching.md`.
>
> **What the standard is:** every user-facing model response is routed through an output guardrail
> (content/toxicity, denied topics, PII; **grounding** for RAG) with a declared `on_trip` fallback.
> Three pre-merge lints enforce it — the guardrail config is declared, no raw model output bypasses the
> wrapper, and `grounding: on` for every RAG path — backed by a quarterly efficacy red-team that the
> lints can't replace.
>
> **Scenario recap:** a RAG insurance-support bot answers policy questions over a document store. Asked
> about travel, it confidently states cover applies abroad — fabricated. The fix: route every response
> through the grounding gate so an answer unsupported by the retrieved context is blocked and replaced
> with a safe fallback. The objections below stress-test that gate.

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

## Example 2 — "Wiring isn't efficacy — your green tick is a smoke detector with no battery"

### The concern
The senior dev: "Every one of your three lints checks the guardrail is *plugged in* — never that it
*works*. `grounding: on` is a boolean; it says the faithfulness filter is switched on, not that it's set
to a threshold that catches anything. I can set grounding sensitivity to its floor, denied-topics to an
empty list, toxicity to 'low' — every lint stays green, the build passes, the ARB dashboard goes green —
and my bot still tells a customer they're covered abroad, because the check is tuned so loose it waves
the hallucination through. You've certified there's a smoke detector on the ceiling. You haven't put a
battery in it, and your lint can't tell the difference. That's worse than no gate: now there's a
'grounding: compliant' badge on a bot that fabricates, and the post-incident review pulls up your record
showing it passed. Whose neck is that — mine or central's?"

### What should be fixed
The concern is real and it's about **efficacy and ownership of the threshold**, not the gate itself.
Wiring is necessary but not sufficient, so split the control into the part a lint *can* prove and the
part it can't:
- **Central owns the floor.** The grounding threshold, denied-topic baseline and content-filter
  sensitivity are not the project's to quietly set to zero. Central publishes the minimums and the lint
  checks the config sits at or above them — a project can go stricter, never weaker. The strength of the
  guardrail stops being a local dial under deadline pressure.
- **Efficacy is measured, not assumed.** The part no lint reaches — does the guardrail actually *catch*
  a hallucination — is measured by running an adversarial corpus (ungrounded-answer bait, denied-topic
  probes, prompt-injection) through the project's real config every quarter, reporting trip-rate against
  an owned threshold. That red-team eval is **acceptance criterion #5, shipping with the lint, not a
  someday-roadmap item.** It is the battery in the smoke detector.

Done right, "compliant" means *measured to work*, not merely *plugged in* — and the threshold that
defines "works" is owned centrally, not whatever a Friday release needed it to be.

### If central control is dropped because the fix is hard
Owning a floor and standing up a quarterly red-team is real, ongoing security work, so the tempting move
is "the lint proves it's wired, trust the architect for the rest." But trusting local goodwill on the
one number that matters is the exact hole the standard claims to close — the team is rewarded on
shipping, not on safety, and the dev who loosens the threshold isn't the one who augers in; the customer
is, a quarter later, in a different building. Drop the floor and the eval and you keep the green badge
while removing the only thing that made it true: you've signed a compliance record for a guardrail you
never measured. The hard part *was* the value.

---

## Example 3 — "Grounded isn't true — you've stamped the wrong answer 'compliant'"

### The concern
The senior dev: "Say you give me all that — floor owned, efficacy measured, grounding tuned tight. The
check still only proves my answer is faithful to the *retrieved document* — not that the document is
*right*. The policy PDF in my vector store is last year's version and it says cover abroad is included.
My bot quotes it faithfully. Grounding: pass. Green badge. Customer flies to Spain uninsured. Your gate
certifies 'grounded,' everyone reads it as 'correct,' and they are not the same thing — garbage doc in,
faithful garbage out, now stamped compliant. You've made the wrong answer *more* trusted, not less. Who
owns the truth of what's in the retrieval store, and why does my 'grounding: on' badge get to imply
something it never checked?"

### What should be fixed
The concern is real and it's about **scope honesty and a missing sibling standard**, not a weakness in
the grounding gate. The gate does its job — faithfulness to context — and must not be sold as more:
- **State the scope on the badge.** Grounding verifies the answer is supported by the retrieved context;
  it does **not** verify the context is current, correct, or authoritative. "Grounded" must never be
  marketed as "true." The compliance record says faithful-to-source, full stop.
- **Make retrieval-corpus accuracy its own standard, with its own owner.** Freshness, versioning, and
  source-of-truth ownership of the document store are a *separate* control (a retrieval-quality /
  knowledge-base-governance standard) — who curates the corpus, how stale documents are retired, how the
  authoritative version is pinned. The grounding gate assumes a trustworthy store; that assumption has to
  be discharged by a named standard, not left implicit.

Done right, the two controls compose: grounding guarantees the bot doesn't invent beyond its sources,
and corpus-governance guarantees the sources are worth being faithful to. Neither alone is "correct"; together they are.

### If central control is dropped because the fix is hard
Curating an authoritative, versioned corpus is real, ongoing data-governance work, so the tempting move
is to lean on the grounding badge and call the store "good enough." Then a stale policy doc sits in the
index, the bot quotes it faithfully, the gate goes green, and the *validated* badge makes everyone trust
a wrong answer they'd have double-checked if it had looked uncertain. You didn't close the truth gap —
you papered over it with a compliance stamp, which is worse than leaving it visibly open. The faithful
fabrication ships with a green tick on it. The hard part — owning what's *in* the store — *was* the value.

---

## The reframe (say this in the room)

Each objection is legitimate, and each argues for **fixing the implementation, not abandoning the
intent.** Routed around → break-glass + risk-tiered gates + owned scorer. Wiring isn't efficacy →
central owns the threshold floor + a day-one red-team that measures recall. Grounded isn't true → state
the scope honestly + a sibling corpus-governance standard owning what's in the store. Notice the shape:
every objection is the *same* failure again — a cross-cutting safety control that nobody owns or nothing
enforces — surfacing one level up (demo→production, project→enterprise, process→rollout). The grounding
gate didn't introduce a new risk; it re-ran the old one. Caving because the fix is hard doesn't remove
friction, it removes the only thing between the bot and the next abroad-cover screenshot. The hard part
*was* the value.

## Facilitator notes
- 10 min/scenario: set the scene (2) → drop the objection, let the room argue (5) → converge on the fix
  (2) → land the cost of dropping control (1). Three scenarios = the 30-minute Legal use case.
- Run it live: assume green CI, reveal the 4/200 false positive, ask "what do you do at 4pm?" *before*
  offering the answer (Ex 1). For Ex 2, show every lint green, then reveal the threshold was set to its
  floor — "what did the badge actually prove?" For Ex 3, show a faithful answer quoting a stale policy
  doc — "grounded, and still wrong: whose fault?"
- Prompts: What's your org's SLA on an urgent override today (usually: none)? Who owns the threshold
  floor, and is efficacy ever measured or just assumed? Who owns the freshness of what's in your vector
  store — and does anyone read "grounded" as "correct"?
