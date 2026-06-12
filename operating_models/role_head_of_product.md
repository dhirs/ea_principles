# Head of Product — Job Spec

**Mission:** own the AI platform and its capabilities as products — make them adopted, reliable, and worth paying for.
**Reports to:** Head of AI CoE (solid).
**Owns the people:** product managers (platform), run / platform engineers (on-call), adoption / enablement.

## Full remit
1. **Product strategy & roadmap** — for the AI platform and shared capabilities (gateway, SDK, eval, guardrails). What gets built next, by consumer value.
2. **Run & SLA** — uptime, support, lifecycle (versioning, deprecation) of every live AI capability.
3. **Adoption** — drive real usage across BUs; embed enablement with delivery teams.
4. **AI FinOps & chargeback** — consumption metering, the cost-recovery/chargeback model, keeping the platform cheaper than DIY.
5. **Standards as products** — the live standards and their schemas, run and supported. *(One workstream — see below.)*

## Day-to-day
- Own the platform roadmap; prioritise by adoption and consumer value (co-owned with the Lead Architect on correctness).
- Own the SLA on the platform and every shipped capability — incidents, on-call, support.
- Accept builds from Engineering at the **readiness gate**; refuse what isn't operable.
- Run adoption: enablement embeds with BU teams; track usage, not just availability.
- Own the chargeback/showback model and the consumption metrics that justify it.

## Standards as products (one section of the role)
Owns each live standard as a consumed product — versioning, deprecation, the SLA, and the config schema the governance wrapper points at. The standing owner once a build pod disbands.

## Owns vs doesn't own
- **Owns:** product roadmap, SLA, run/platform engineering, adoption, FinOps/chargeback, lifecycle.
- **Does NOT own:** what a standard/architecture says (architect), the build (Engineering), certification/sign-off (Governance / ARB), use-case business outcomes (BUs).

## Key seams
- Product-shaped work — the platform lives forever; it needs a standing owner the day a pod disbands.
- The readiness gate is the defence against throw-it-over-the-wall — hold the acceptance checklist.
- Chargeback must keep the platform cheaper than DIY/agency on total cost — or BUs route around it (shadow AI).

## Cadence
SLA / incident review weekly · adoption & consumption metrics monthly · readiness-gate acceptance per build · roadmap sync with Architecture quarterly.
