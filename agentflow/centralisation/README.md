# Centralisation decision

One sheet per principle. Three rows, two columns. Decide.

| | Centralise | Project-local |
|---|---|---|
| Cost to the company | | |
| Maintenance | | |
| Applicability to other projects | | |

**Decision:** <centralise / project-local>
**Why:** <one sentence>

---

## Example — GO1B1-01

Principle: Maintain a versioned ground-truth evaluation harness for agent decisions in the workload repository.

| | Centralise | Project-local |
|---|---|---|
| Cost to the company | Standing platform team to run the gate for every agentic repo. | Each project owns its CI; platform pays only for the rule text and reference implementation. |
| Maintenance | Continuous — every project's scenario changes route through platform. | Per-project; platform maintains only the shared substrate. |
| Applicability to other projects | Every agentic project. | Every agentic project (enforced locally). |

**Decision:** project-local
**Why:** Applicability is identical either way; centralising loads the platform team without any uplift.
