# Head of Product — Job Spec

**Mission:** own the AI platform and its capabilities as products — make them adopted, reliable, and worth paying for.
**Reports to:** Head of AI CoE (solid).
**Owns the people:** product managers (platform), run / platform engineers (on-call), adoption / enablement, the SDK migration / retrofit lead.

## Full remit
1. **Product strategy & roadmap** — for the AI platform and shared capabilities (gateway, SDK, eval, guardrails). What gets built next, by consumer value.
2. **Run & SLA** — uptime, support, lifecycle (versioning, deprecation) of every live AI capability.
3. **Adoption** — drive real usage across BUs; embed enablement with delivery teams.
4. **AI FinOps & chargeback** — consumption metering, the cost-recovery/chargeback model, keeping the platform cheaper than DIY.
5. **Standards as products** — the live standards and their schemas, run and supported. *(One workstream — see below.)*
6. **SDK adoption & brownfield migration** — own getting project teams onto the central SDKs: greenfield-by-default, and the retrofit of running systems. *(One workstream — see below.)*

## Day-to-day
- Own the platform roadmap; prioritise by adoption and consumer value (co-owned with the Lead Architect on correctness).
- Own the SLA on the platform and every shipped capability — incidents, on-call, support.
- Accept builds from Engineering at the **readiness gate**; refuse what isn't operable.
- Run adoption: enablement embeds with BU teams; track usage, not just availability.
- Own the chargeback/showback model and the consumption metrics that justify it.

## Standards as products (one section of the role)
Owns each live standard as a consumed product — versioning, deprecation, the SLA, and the config schema the governance wrapper points at. The standing owner once a build pod disbands.

## SDK adoption & brownfield migration (one section of the role)
Owns the journey of getting project teams onto the central SDKs — both new builds and the retrofit of running systems. A standing **migration / retrofit lead** sits under this role (peer to the enablement leads), not a per-pod temporary.

- **Greenfield-by-default** — new projects start on the SDK because it's the scaffold/starter template (content from Architecture, distributed by Product). The compliant path is the path of least resistance.
- **Brownfield retrofit** — own the sequence: pilot on willing teams to size the real effort, then roll out by risk (high-blast-radius first), with a migration kit (compatibility shim, runtime adapters, codemods) so teams adopt call-by-call, not big-bang.
- **Enable before enforce** — adoption and support come first; the routed-execution lint (Governance's gate) only switches to a required check once the SDK has passed the readiness gate and the migration path exists. Product holds this sequencing.
- **Measure with telemetry** — % of model calls flowing through the SDK per workload is the real compliance metric, and it falls out of the SDK itself.
- **Waivers** — run the day-to-day waiver intake for genuine gaps (unsupported runtime/edge case); the waiver *authority* stays with Governance, but Product surfaces where the SDK needs work.

## Owns vs doesn't own
- **Owns:** product roadmap, SLA, run/platform engineering, adoption, **SDK migration/retrofit**, FinOps/chargeback, lifecycle.
- **Does NOT own:** what a standard/architecture says (architect), the build of the SDK and migration tooling (Engineering), certification/sign-off and waiver authority (Governance / ARB), the mandate's funding/air-cover (Steering Committee / Enterprise ARB), use-case business outcomes (BUs).

## Key seams
- Product-shaped work — the platform lives forever; it needs a standing owner the day a pod disbands.
- The readiness gate is the defence against throw-it-over-the-wall — hold the acceptance checklist.
- Chargeback must keep the platform cheaper than DIY/agency on total cost — or BUs route around it (shadow AI).
- Migration is co-delivered, not solo — Product's retrofit lead owns the *journey*; Engineering supplies the build capacity and the migration tooling. Name it a workstream or it falls between the two.
- Enforce-after-enable — Product controls when a standard's gate flips to mandatory; flipping the lint before the SDK is supportable just teaches teams to disable it.

## Cadence
SLA / incident review weekly · adoption & consumption metrics monthly · migration / retrofit progress (SDK-call coverage %) monthly · readiness-gate acceptance per build · roadmap sync with Architecture quarterly.
