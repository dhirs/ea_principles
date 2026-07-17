# Stage 1 — Requirements (Implementation)

How to run Stage 1. Concept: `methodology.md`. Deliverable: `stage1_output.md`. Next: `stage2_acquire.md`.

Stage 1 does **no querying and spends no credits**. Its only job is to turn the service's pain into the exact input set Stage 2 will run, and stop.

## Goal

Produce `stage1_output.md` containing two things, and nothing else:

1. the **target NAICS sectors**, and
2. the **firmographic + native-ICP requirements**: geography, headcount, revenue, and any query-native ICP filter.

## Procedure

1. **State the pain the service solves.** Who feels it, and what has to be true of a company for it to feel it? Every filter below must trace back to this sentence — if you can't say why a sector is in, it isn't in.
2. **Judge the best-fit industries** and express them as **2-digit NAICS sectors**. Present them to the user for selection; do not assume. Ranged sectors (Manufacturing 31–33, Retail 44–45, Transportation 48–49) are written as ranges here but **passed to the query as each individual digit** — see `stage2_acquire.md`.
3. **Set the firmographic band** — geography, headcount, revenue. Keep each one a filter the query engine can express natively.
4. **Pick native ICP filters** that indicate the *capacity* to buy (e.g. a marketing department of a given size). These are structural, slow-moving traits.
5. **Write `stage1_output.md`** as two tables: sectors, then requirements.
6. **Get explicit confirmation of the full filter set before Stage 2 runs.** Stage 2 spends credits; a modified query needs fresh approval.

## What belongs here vs. later stages

| Signal type | Stage | Why |
|---|---|---|
| Sector, geography, headcount, revenue | **1 → 2** | Structural. Defines who is even a candidate. |
| Department headcount (e.g. marketing 5–20) | **1 → 2** | Structural capacity; query-native. |
| **Technology / technographics** | **4** — not here | It's a *fit* signal, scored weekly. Putting it in the query silently shrinks the universe and you can never score what was excluded. |
| Job postings, hiring, funding events | **5 / 4** — not here | Volatile behavioural signals. Never a build-pipeline filter. |

**The rule: Stage 2's query defines the universe; anything scored later must not narrow it.** A filter here is a hard exclusion — an account that fails it is invisible forever. A signal at Stage 4/5 only moves a score. When unsure, prefer the later stage.

## Exclusions

Default to **none**. Exclusions are a common source of drift: a carve-out written for an earlier ICP quietly contradicts a later sector list (e.g. excluding a sector that a subsequent revision made a target). If an exclusion is genuinely needed, write down which target it protects, and re-read every exclusion whenever the sector list changes.

Out-of-scope companies that slip through are cheaper to catch at Stage 3, where the decision is free, reviewable, and reversible.

## Output contract

`stage1_output.md` — the full input set, no prose beyond the tables. Stage 2 runs *exactly* this and nothing else.

## Cadence

One-time per service. Revisit only on a real ICP change — and note that changing it invalidates the built universe: Stage 2 must re-sweep and Stage 3 must delete the old set before repopulating (see `stage3_qualify.md`).
