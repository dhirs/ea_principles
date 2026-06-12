# AI Solution Architect Accelerator — 5-Week Curriculum

**Positioning:** The senior-developer-to-AI-architect transition that nobody teaches — taught by a practitioner who runs an AI Architecture Review Board.

**Format:** Live cohort, 5 weeks. ~2 hours of live time per week (one teaching session + one workshop/clinic), plus a weekly applied assignment that builds toward a capstone. Cloud-agnostic — principles and patterns are portable across AWS, Azure, GCP, and on-prem.

---

## Who this is for

Senior developers, tech leads, and senior MLEs who can already build, and who are now expected to *design and defend* AI solutions — not just implement them. The course assumes you can read code and understand systems; it does **not** teach you to code.

**Prerequisites:** 5+ years building software/ML; comfort with system design at the single-application level; familiarity with at least one cloud. No prior architecture-role experience required — that's the point.

## The core thesis

The jump from senior engineer to architect is **not** a skill-acquisition problem — it's a **scope-acquisition** problem. Engineers stall by collecting certifications when the real gap is *owning cross-functional decisions*: trading off business goals, technical constraints, cost, risk, and organisational reality, then convincing other people to commit to your call. AI raises the stakes because the line-by-line coding is the part getting automated, while the judgment — what to build, why, at what cost, under what governance — is the part that compounds in value.

Every module therefore teaches two things at once: the **artifact** (the discovery doc, the sizing model, the architecture, the ARB pack) and the **scope muscle** (how to drive the decision and carry the room).

## What you can do by the end

1. Run a discovery session that qualifies an AI use case and surfaces the real requirements.
2. Build a defensible commercial sizing and business case for an AI solution, including inference economics.
3. Produce conceptual, logical, and physical architectures and explain when each is the right altitude.
4. Prepare and defend an Architecture Review Board submission, including AI-specific governance.
5. Connect a single solution to the enterprise — platform thinking, reuse, and roadmap.
6. Defend a complete AI solution design at a live mock ARB (the capstone).

## The running case study

A single realistic case threads through all five weeks so each skill compounds on the last:

> **"Aurora Assist"** — a mid-sized insurer wants an AI assistant that answers customer policy questions and triages simple claims (e.g. damaged-appliance cover), operating across the UK and EU. It must be cheaper than the call centre, must not give wrong cover information, and must satisfy the regulators.

Students apply each week's skill to Aurora Assist in the workshop, and **in parallel develop their own project** (a real or realistic AI use case from their world) which becomes their capstone.

---

## Week 1 — Discovery & Requirements

**Theme:** An architect's first job isn't to design — it's to *understand the problem well enough that the design becomes obvious.*

**Learning outcomes**
- Run a structured discovery session and control the room without dominating it.
- Qualify an AI use case: is this even an AI problem, and is it feasible?
- Translate vague business asks into requirements and non-functional requirements (NFRs).

**Teaching session**
- The discovery canvas: business outcome, users, current process, data, constraints, success metrics.
- AI use-case qualification — feasibility, data readiness, and the "is AI the right tool" test (when a rules engine or a human is the better answer).
- NFRs that are specific to AI: accuracy/quality, latency, cost-per-interaction, safety, explainability, and the human-oversight requirement.
- The scope muscle: asking the question behind the question; saying "no" or "not yet" to a stakeholder.

**Workshop/clinic**
- Live mock discovery session for Aurora Assist with the instructor role-playing the business sponsor.
- Students extract requirements and NFRs in real time, then critique each other's framing.

**Assignment**
- Run (or simulate) a discovery for your capstone project. Produce a one-page discovery brief + an NFR table.

**Case milestone:** Aurora Assist discovery brief and NFRs.

---

## Week 2 — Commercial Sizing & the Business Case

**Theme:** Architects who can't talk money don't get listened to. Sizing is where credibility is won or lost.

**Learning outcomes**
- Build a defensible cost model for an AI solution, including inference economics.
- Construct a business case: TCO, ROI, and the build-vs-buy decision.
- Communicate uncertainty honestly without losing the room.

**Teaching session**
- Inference economics for LLM/AI systems: token cost, context size, caching, model right-sizing, the difference between a demo bill and a production bill.
- Total cost of ownership: model/inference, data, integration, human-in-the-loop, monitoring, maintenance, and the often-forgotten governance cost.
- Business case mechanics: baseline cost (the call centre), expected savings, ramp, sensitivity analysis.
- Build vs buy vs fine-tune vs orchestrate: a decision framework, not a religion.
- The scope muscle: presenting a number you'll be held to, and defending the assumptions behind it.

**Workshop/clinic**
- Size Aurora Assist together: estimate volumes, model the per-interaction cost two ways (naive vs cached prefix), and compare against the call-centre baseline.

**Assignment**
- Build a sizing model and a one-page business case for your capstone. Include a sensitivity table.

**Case milestone:** Aurora Assist cost model + business case.

---

## Week 3 — Architecture Craft: Conceptual, Logical, Physical

**Theme:** The same system, drawn at three altitudes for three audiences. Knowing which altitude you're at is half of being an architect.

**Learning outcomes**
- Produce conceptual, logical, and physical views and explain what each is *for* and *who it's for*.
- Apply AI reference patterns (RAG, tool-using agents, orchestration) at the right altitude.
- Capture trade-offs as decision records instead of opinions.

**Teaching session**
- Conceptual (what & why, for sponsors), logical (components & flows, for the team), physical (deployment & tech, for the builders) — and the classic mistake of mixing altitudes in one diagram.
- AI reference patterns, cloud-agnostic: retrieval-augmented generation, agentic tool-use, the model/prompt/data/guardrail/observability "surrounding environment" of any AI workload.
- Trade-off analysis and Architecture Decision Records (ADRs): making the *why* auditable.
- The scope muscle: defending a trade-off where every option has a real downside.

**Workshop/clinic**
- Draw Aurora Assist at all three altitudes. Stress-test the logical view: where does it break under load, bad data, or a wrong answer?

**Assignment**
- Produce conceptual + logical + physical views and two ADRs for your capstone.

**Case milestone:** Aurora Assist three-altitude architecture + ADRs.

---

## Week 4 — Governance & the Architecture Review Board

**Theme:** A great design that can't pass review isn't a great design. This is the week that most distinguishes an AI architect from a generic one.

**Learning outcomes**
- Prepare an ARB submission that anticipates the hard questions.
- Classify an AI system's risk and apply the governance that follows.
- Defend a design under scrutiny without becoming defensive.

**Teaching session**
- What an ARB actually does, what it's looking for, and why submissions get bounced.
- AI risk classification and the governance landscape (cloud-agnostic): EU AI Act risk tiers, NIST AI RMF as the common risk language, ISO/IEC 42001 as the management-system wrapper, and how the same controls show up under US sector regimes.
- The AI-specific control surface: logging/traceability, human oversight, guardrails, evaluation, model versioning, data governance, security — and which ones a given system actually needs.
- Responsible AI and the failure modes that bite in production (silent regression, hallucination, cost burn) and the gates that prevent them.
- The scope muscle: reading the room in a review, conceding the right points, holding the essential ones.

**Workshop/clinic**
- Classify Aurora Assist (the chatbot vs the claims-triage agent are *different* risk cases). Build the ARB pack. Run a live mini-ARB where peers play board members.

**Assignment**
- Produce a full ARB submission pack for your capstone, including a risk classification and the governance controls it triggers.

**Case milestone:** Aurora Assist ARB pack.

---

## Week 5 — Solution to Enterprise Architecture (+ Capstone)

**Theme:** One good solution is a project. A reusable pattern is an architecture. This week zooms out from the workload to the enterprise — then you defend everything.

**Learning outcomes**
- Connect a single solution to enterprise concerns: platform, reuse, standards, roadmap.
- Distinguish what belongs in one workload from what belongs in a shared capability.
- Present and defend a complete design end-to-end.

**Teaching session**
- Solution architecture vs enterprise architecture: scope, time horizon, and audience.
- Platform thinking for AI: shared components (guardrails, observability, eval, model registry) that every workload inherits, so governance and quality become defaults instead of per-project scrambles.
- Project-level vs enterprise-level concerns: when to solve it once in a repo vs when to build a central capability.
- Roadmaps and influence: getting an enterprise direction adopted without authority.
- The scope muscle: telling an enterprise story that a CIO will fund.

**Capstone — live mock ARB defense**
- Each student presents their end-to-end design (discovery → sizing → architecture → governance → enterprise fit) and defends it before a mock board (instructor + peers).
- Graded against the capstone rubric below. This is the course's "Demo Day" equivalent and the artifact students take to interviews and promotion cases.

**Case milestone:** Aurora Assist enterprise view; capstone defense.

---

## Capstone rubric

Each design is assessed on:

1. **Problem clarity** — is the use case well-qualified, with real requirements and NFRs?
2. **Commercial defensibility** — does the sizing and business case hold up to questioning?
3. **Architectural soundness** — right altitude(s), sensible patterns, explicit trade-offs.
4. **Governance fitness** — correct risk classification and the controls that follow.
5. **Enterprise fit** — reuse, platform thinking, and a credible roadmap.
6. **Defense** — did they carry the room: anticipate questions, concede well, hold the essentials?

## What students walk away with

- A complete, defensible AI solution design portfolio piece (their capstone).
- Reusable templates: discovery brief, NFR table, sizing model, three-altitude architecture, ADR, ARB pack.
- A peer cohort and network (consistently cited as half the value of cohort courses).

---

## Instructor / facilitation notes

- **The differentiator is you.** Most AI-architecture courses teach AI *engineering*. Yours teaches the architect *craft* with real ARB and governance artifacts. Show real (redacted) examples wherever possible — that's the moat.
- **Weave, don't bolt.** Keep AI-specific substance inside every module so it never reads as "generic architecture + AI sticker."
- **The scope muscle is the spine.** Return to "owning the decision and carrying the room" every week — it's the gap the market says nobody teaches.
- **Live + feedback + cohort** is what sells and what drives completion. Protect the workshop/clinic time; it's where the learning lands.
- **Pricing:** pilot cohort lower (~$900–1,300) to harvest testimonials, then raise toward $1,800–2,500 once you have social proof.

## A note on starting from zero (audience)

The curriculum is the asset; distribution is the open problem. Since there's no list yet, the realistic path is: build credibility signal first (write/post the "transition nobody teaches" thesis, share real ARB/governance war-stories, a free workshop or waitlist), then launch a small paid pilot. The course content above is ready to teach — the next gap to close is getting the first 15–30 people in the room.
