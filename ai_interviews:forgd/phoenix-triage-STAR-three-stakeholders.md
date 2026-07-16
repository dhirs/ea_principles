# Phoenix Life Triage Agent — Conflict-Resolution STAR Stories

*Three stakeholder conflicts, one per group. Situation / Task / Action / Result.*

---

## 1. Enterprise Architecture team (standards & governance) — "no AI decisions; humans must review everything"

**Situation.** The client's EA/governance team, who own the standards catalogue and ARB sign-off, opened with a hard line: an LLM must not make *any* routing decision — every case had to be 100% human-reviewed — because they read "AI deciding where a regulated case goes" as an automated-significant-decision risk. Taken literally, that gutted the business case; the entire point was to cut manual triage.

**Task.** Get governance comfortable enough to allow *meaningful* automation without weakening the control they were rightly protecting — and do it collaboratively, since they held the go/no-go and going over their heads would have poisoned the engagement.

**Action.** I didn't argue for more autonomy head-on. I reframed the risk *with* them: triage only *routes and prioritises*, it doesn't decide eligibility or payment, so routing a case to a team has no legal/significant effect and sits outside the automated-decision rules entirely. Then I moved the disagreement onto architecture they could trust — **"model informs, code enforces"**: the LLM only reasons (stateless, inside Bedrock), while routing and the human gate live in **Step Functions as deterministic states they controlled**, with the SFN execution history as an immutable, replayable audit trail. I proposed **graduated autonomy** — auto-route only the high-confidence, low-risk tail, widening only as an eval set cleared a bar *they* set — and mapped every control to their own standards catalogue so they signed against something familiar.

**Result.** Governance signed off. We shipped automation on the safe tail with a defensible position, a boundary they helped define, and an eval-gated path to widen it. The conflict turned them from a blocker into a co-owner of the control model.

---

## 2. Project architects — "this is over-engineered: two orchestrators doing the same job"

**Situation.** In design review the project architects — who'd own the system long-term — pushed back hard: *"Why LangGraph and Step Functions? They both do human-in-the-loop; that's redundant orchestration. Pick one."* A direct challenge to my design, and they weren't wrong that the two mechanisms overlapped.

**Task.** Resolve a real technical disagreement with the engineers who'd maintain the system — without caving to a worse design or dismissing a valid point.

**Action.** I conceded the part they were right about: the overlap between LangGraph's interrupt/checkpoint and SFN's `.waitForTaskToken` was real, so I **removed it** — by making the agent **stateless**, so there was no second checkpoint to reason about. Then I made the boundary explicit and gave each tool one job: Step Functions owns durable orchestration and the human gate; LangGraph is confined to the reasoning core and justified *only* where the reasoning is genuinely agentic (multi-intent, grounding-retry). Crucially I put the decision back to the data — a **documented fallback**: if the mail-mix proved mostly clean single-intent, we'd drop LangGraph and call Bedrock directly. That turned it from me defending a framework into a measurable criterion we both accepted.

**Result.** The architects endorsed the design *because* they helped draw the boundary, and owned it afterward. We avoided both the over-engineering they feared and the hidden fragility of collapsing everything into one tool. Conceding the valid half was what won the whole.

---

## 3. Project delivery lead — "your evals and human-gating are scope creep; we need to ship"

**Situation.** The delivery lead, accountable for the timeline and the ops desk's capacity, wanted to auto-route aggressively from day one to hit the date and show ROI, and saw my insistence on an eval harness plus human-in-the-loop as scope creep that would slow delivery.

**Task.** Protect the safety/governance floor (without which the ARB wouldn't sign) while genuinely respecting the delivery pressure — not win an argument, but land a plan we both backed.

**Action.** I stopped framing it as safety-vs-speed and found the slice that served both: **phased autonomy.** His aggressive-auto-route plan wasn't actually deliverable on the date anyway — without evals it fails governance and never goes live — so I replaced it with a plan that hits the *same* date: ship working triage plus auto-routing on a small, proven-safe tail (low-risk, single-intent servicing admin), humans handle the rest. I reframed the eval harness not as overhead but as the *mechanism that unlocks* automation — right-sized to the day-one slice, then growing as it earns it — so it served his ROI goal rather than fighting it. I showed that `.waitForTaskToken` means paused cases consume no compute, so gating didn't hurt throughput, and gave him a shared, visible metric — **straight-through rate** — so "are we delivering" had a number we both watched.

**Result.** We shipped on schedule with real automation on the safe tail and a demonstrable win for the delivery lead, then widened the envelope post-launch as evals earned it. The eval work he'd called scope creep became the thing that let him report rising automation month over month.
