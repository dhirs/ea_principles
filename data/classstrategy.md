# Class Strategy — Talking Points for the Class Deck

A running list of points and tensions that should make it into the class deck. Captured at the point of surfacing so they are not lost. Each point names what it is, why it matters for the class audience (senior architects, Lead Data Architects, Heads of AI), and any worked example from the catalogue that illustrates it.

---

## 0. Landing page (the contract with the audience)

**Page.** [Why Enterprise AI Agents Fail Beyond The Demo — Maven lightning lesson](https://maven.com/p/f029e1/why-enterprise-ai-agents-fail-beyond-the-demo)

**Format.** 1-hour Zoom lightning session, free, Mon 22 Jun 2026 11:00 UTC. 55 signed up at time of capture. Funnels into the paid course "Preventing Agent Failures in Enterprise AI: Marketing Personalization Case Study".

**What the page promises attendees.** Four stated learning outcomes (current as of 2026-05-27; an earlier version of the page promised "15 Examples Of Principles in Agentic AI" — that has been replaced):

1. **Prevent AI Agent Sprawl at Scale.** "Understand how AI architecture principles replace sandbox heroics with specific, enforceable production controls."
2. **How to use AWS GenAI Lens as the source of AI principles.** "Use the AWS GenAI Lens (Azure / GCP optional) as your universe — your catalogue makes each best practice enforceable."
3. **Walk through a real production failure.** "Take a real failure apart and see which principle would have caught it before it ever shipped."
4. **Understand how AI governance differs from AI architecture.** "Both cause production failures — understanding the scope of each helps build concrete controls that prevent them."

**Page vocabulary already seen by attendees** (the deck must echo, not contradict): "development spaghetti", "individual heroics rather than systemic standards", "shelfware", "rigid principles", "architecting for $10B firms", "regulated environment", "fragile logic", "sandbox heroics", "specific, enforceable production controls".

**How the four outcomes map to the current deck.**

- **Outcome 1 (anti-sprawl).** Covered by slides 4-5 (FTSE cracks → why this happens). Strong.
- **Outcome 2 (AWS Lens as source).** Touched on slide 8 (the BP → principle mapping) and slide 17 (AWS gave you the headings). Currently buried in the middle and the end; promised as a top-line outcome but not framed as a top-line claim anywhere in the deck. Needs a dedicated slide that says explicitly: "AWS GenAI Lens is our source of truth; our catalogue concretises each best practice; here's how the relationship works." Slide 17's content can be promoted into this role.
- **Outcome 3 (walk through a real production failure).** Slides 7-11 (returns triage narrative). The deck's strongest section. Stays.
- **Outcome 4 (governance vs architecture).** **NOT currently in the deck.** New content. Maps to the work captured in `governance.json` and the GOV_001 entry. Needs one slide making the architecture/governance split explicit: architecture says "what artefact must exist, where, what's checked"; governance says "who raises change, who approves, who edits, who deploys". Both prevent production failures; conflating them is itself a failure mode. PRIN_007 / GO1B1-01 / GO1B1-04 each have a governance shadow (who can change the harness; who can update the drift baseline; who signs the ADR) — picking one of those to illustrate the split keeps the deck cohesive.

**Constraints on the deck.**

- **Agentic emphasis.** The page is in Maven's Agentic AI category and uses agent vocabulary. Principles shown should lead with the agentic application; LLM-only and RAG framings are secondary. The current catalogue's GO1B1-01 / GO1B1-02 are agentic-only mandatory; GO1B1-03 / GO1B1-04 broaden to RAG / LLM-only.
- **1-hour budget.** Allowing 10 minutes for intro and 10 for Q&A leaves ~40 minutes of content — roughly 12-15 slides at standard pace. Current deck is 17 slides with very dense slides 4 and 10; tight on time.
- **Funnel intent.** The lightning is a top-of-funnel teaser for the paid course ("Preventing Agent Failures in Enterprise AI: Marketing Personalization Case Study"). Deck should end with a clear "want the rest? see the course" CTA, which the current deck doesn't have. The course's case study is **marketing personalization** — worth a beat at the end positioning that.
- **Stale references in the current deck.** PRIN_007 (legacy ID; closest current equivalent is GO1B1-01); slide 8 header types "GENPERF01-BP01" but means GENOPS01-BP01; slide 8 names the BP as "Build a testing harness with ground truth data" but actual AWS title is "Periodically evaluate functional performance". Fix in any redraft.

**Implication for strategy.** The "15-vs-1" tension I had created earlier is gone — the current page agenda is well-aligned with the deck's deep-one-principle approach. The real gaps now are: (a) outcome 2 (AWS Lens as source) needs to be promoted from buried-on-slide-17 to a top-line claim near the front; (b) outcome 4 (governance vs architecture) is entirely missing and needs at least one slide; (c) stale IDs and BP titles need fixing; (d) a course-funnel CTA needs to land at the end.

---

## 1. The architecture / implementation layering tension

**The point.** Architecture catalogues have two failure modes.

(a) **Too abstract.** "Monitor for drift", "validate inputs", "encapsulate metrics" — reads like every AWS WAF Lens or generic guidance document. Adopters cannot operationalise it. This is the criticism the catalogue makes of AWS GenAI Lens itself: AWS gives a heading; we need a contract.

(b) **Too prescriptive.** "Put this YAML at this path with these CI gates" — locks adopters into one implementation choice (Git repo + CI on PRs) when their environment may be very different. A regulated bank may use a document-management system with business-user approval workflows. A multi-channel retailer may use a CDP-style declarative config where business users edit through a UI and an auto-deploy pipeline takes over. A pharma may use a vendor-managed model platform where the vendor's control plane IS the gate.

The catalogue we are building sits between these two — every principle names what must be true (the invariant) AND one concrete way to make it true (this catalogue's reference implementation). Adopters can either inherit the implementation as-is or substitute their own, as long as the invariant still holds.

**Why this matters for the class audience.** Senior architects in regulated industries (banks, insurance, healthcare, pharma) often work in environments where the "Git repo + CI" implementation pattern does not fit. If the catalogue is presented as recipes, those architects will reject it. If it is presented as invariants with one reference implementation, those architects can adopt the invariants and write their own implementation. The positioning determines whether the catalogue is adoptable across industries or locked to one stack.

**Worked example — GO1B1-04 (drift monitoring).** The invariant: a deployed workload must operate a scheduled drift monitor against a declared baseline; the monitor's configuration (metrics, cadence, baseline, thresholds, alert routing) must be declared in a discoverable artefact that the validator can inspect at gate time; baseline updates must be coupled to model changes. This catalogue's reference implementation: `eval/drift/config.yaml` in the workload repository, CI gates on PRs, ADRs justifying baseline non-updates. A bank using a document-management system could satisfy the same invariant with a controlled config document, a business-user approval workflow, and a deployment-time check rather than a pre-merge CI gate. Same principle, different implementation.

**For the deck.** Worth a slide making the two-failure-modes argument visually (abstract ↔ specific axis, with the catalogue's positioning marked between). Then a worked example of one principle showing the invariant + implementation split — GO1B1-04 is the cleanest one to use because the implementation choice (Git repo + CI) is so obviously not universal. Frames the catalogue as a worked example of architectural rigour rather than a stack-specific recipe.

**Open question (parked).** The catalogue currently mixes invariant and implementation in `statement` + `solution` + `gates` without an explicit boundary. Three options were discussed: (A) status quo; (B) tighten existing fields, mark `solution` + `gates` as "this catalogue's reference implementation" and a convention note in `taxonomy.json` saying the layer split is real; (C) split into a dedicated `principle_invariants` field. Parked for now; revisit once a couple more principles are in.

---

## 2. "Playbook" — the chosen word for the implementation layer

**The point.** During the 2026-05-29 Part 3 authoring pass, the deck kept reaching for a word to name the concrete enforcement layer that sits between a principle (the invariant) and a governance process (the human approval chain around changing it). Several candidates were tested live: "control" (landing-page word, but compliance-flavoured and overloaded — both "technical controls" and "administrative controls" exist in audit vocabulary); "reference implementation" (accurate but clunky in deck language); "rule" / "rail" / "recipe" (alliterative variants with "control" but none landed); "recommendation vs control" (turned out to describe the architecture work itself, not the architecture-vs-governance split). The word that landed is **playbook**.

**The chosen layering.** AWS best practice → principle (the rule / invariant) → playbook (one concrete way for a team to enforce the principle — artefact, path, check). Operational, not compliance-flavoured. Doesn't make senior architects feel audited. Reads as "the team's chosen way to enforce this rule," which is exactly what the implementation layer is.

**Why this matters for the class audience.** The lightning's three-section structure now reads cleanly under one terminology: Part 1 names the problem and the role of principles; Part 2 ("From Principles to Playbook") walks one principle through its playbook end-to-end; Part 3 ("Governance — The Control Element") names the governance sibling artefact that lives alongside the playbook, kept separate. Without a settled word for the middle layer, every section transition stumbles.

**Implication for catalogue authoring.** The catalogue does not need to add a `playbook` field. Schema unchanged. The convention is purely a deck-side framing — the rule lives in `statement`, the playbook lives in `solution.approach` + `gates`, and the governance sibling lives outside the principle entirely (in `governance.json` and downstream policy artefacts). The architecture/implementation layering tension parked at entry 1 above is still parked; "playbook" is the word for the implementation layer when one is needed, not a schema decision.

---

## 3. Marketing personalization domain gap in the lightning deck

**The point.** The completed lightning deck (Datawhistl version, 17 slides) uses the returns triage agent as the worked example throughout — slides 4, 9, 10, 11, 14, and 15 all return-triage. The paid course the lightning funnels into is "Preventing Agent Failures in Enterprise AI: **Marketing Personalization Case Study**". A senior architect who watches the lightning end-to-end and clicks the course CTA has no marketing personalization context whatsoever. The funnel has a domain gap and the gap was missed for too long during the 2026-05-29 authoring pass.

**Why this matters for the class audience.** The lightning's whole job is to make the course feel like the obvious next step. If the worked example throughout the lightning is a different domain from the course's case study, the CTA reads as "you just watched a returns-triage story, now buy a personalization course" — a non-sequitur the attendee has to bridge themselves. Most won't.

**Three paths considered (2026-05-29).**

(a) **Bridge on the CTA slide only.** Smallest lift. Returns triage stays the lightning's worked example. The course CTA opens with: "You just saw this on returns triage. The course goes deep on the same principles in marketing personalization — the workload most of you are actually shipping." Then the agenda. Works if "personalization has the same failure modes as returns triage at a deeper level" is defensible.

(b) **Inject one personalization beat in Part 3.** Returns triage carries Parts 1 and 2. Part 3's governance pivot uses a marketing personalization example instead of the returns-policy gift/21-days/packaging scenario. CTA bridges: "you saw returns triage at project level, personalization at governance level — the course goes deep on personalization end-to-end."

(c) **Retool the lightning around personalization throughout.** Biggest lift. Six slides rewritten. Loses the architect-leaves narrative that lands well. Not worth it for the current run.

**Chosen path: (b).** Cheap, threads the case study into the lightning without rewriting Part 1 / Part 2, gives the CTA bridge a real bridge to point at. Pending implementation in the next deck pass.

**For the deck.** Slide 17's question/elaboration table (the "Who adds new scenarios / Who edits existing ones / How does the change reach production" governance pivot) gets its worked-example column re-anchored from returns-policy scenarios to marketing personalization scenarios. The course CTA slide gets a one-line bridge sentence at the top of the agenda. No other slide changes.

---

## 4. Paid workshop agenda — 4-item, concrete-first ordering, marketing personalization as spine

**The point.** The lightning's course-CTA slide must list what the paid workshop delivers, in a shape that justifies the price tag and the time commitment. Four items, agreed 2026-05-29 after iteration:

1. **Anatomy of an enforceable principle.** Taxonomy + contract walked through one marketing personalization principle end-to-end. (One principle, fully populated against schema v1.8.)
2. **Five principles, five case studies.** The load-bearing principles for a marketing personalization agent in production. Each one carries its own case study — not a tour across pillars, a deliberate selection of the five that govern personalization workloads.
3. **A framework to pick yours.** `applicability` (pattern-criticality map) + `maturity_level` applied to the attendee's workload. Which principles matter day one? Which wait for scale? Which never apply?
4. **Author your first principle.** Hands-on slot. Attendee brings their own AWS BP, authors against the statement rubric (`agentflow/sections/statement/rubric.json`). Take-home asset: industry-tailored failure-example skill — pick your industry + pattern, get illustrative failure scenarios for each of the five principles regenerated for your context.

**Ordering rationale.** Concrete-first (workload → principles → framework → your turn). Schema-first (taxonomy → principles → framework → hands-on) hits harder for academics than working architects. Senior architects want to see it work on a workload they recognise, then learn the structure underneath. Taxonomy lands as "and here's how it's structured" once they've seen it work — not as "here's the abstract spec you'll need before any examples make sense."

**Governance is deliberately out of scope for the paid course.** The lightning's Part 3 names the governance axis as a second failure mode; the course teaches the architecture half deeply. Lightning's CTA framing must not pitch the course as covering both. Treat governance as a future product, a sibling consulting engagement, or out-of-scope for this offering.

**Future product parked.** A separate 5-day deeper build course — attendees build their own catalogue + agentflow LangGraph pipeline, walk away with the artefacts — was considered and parked. Premature: agentflow LangGraph plumbing is incomplete, only GENOPS01-BP01 has been walked through, no proof the pipeline scales across BPs. Revisit after agentflow Phase 2 (statement authoring node) ships and a second BP walkthrough validates the pipeline.

**Industry-tailored failure-example skill — workshop deliverable.** A Cowork skill that takes industry + implementation_type as input, pulls the relevant principle's compiled `explain_prompt`, calls an LLM, returns the JSON `{use_case_background, issue_detail}`. Essentially packages the runtime UI's Problem-tab Explain affordance as a Cowork-callable surface. Coverage gated by principle `explain_prompt` availability — currently GO1B1-01/02/03/04. Build deferred until after the lightning ships; not on the critical path. Becomes item 4's take-home asset.

---
