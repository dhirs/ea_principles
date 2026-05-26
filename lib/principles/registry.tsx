import { StatementSection } from "@/components/principles/sections/StatementSection"
import { ProblemSection } from "@/components/principles/sections/ProblemSection"
import { SolutionSection } from "@/components/principles/sections/SolutionSection"
import { GatesSection } from "@/components/principles/sections/GatesSection"
import { FrameworkMappingsSection } from "@/components/principles/sections/FrameworkMappingsSection"
import { EvidenceSection } from "@/components/principles/sections/EvidenceSection"
import { KeyValueSection } from "@/components/principles/sections/KeyValueSection"
import { ChangeHistorySection } from "@/components/principles/sections/ChangeHistorySection"
import { UnknownSection } from "@/components/principles/sections/UnknownSection"

export type SectionEntry = {
  key: string
  title: string
  content: React.ReactNode
}

// Top-level keys consumed by the HeaderBar — skipped in the tab strip.
export const HEADER_KEYS = new Set([
  "principle_id",
  "pillar",
  "focus_area",
  "impact_level",
])

type RegistryEntry = {
  title: string
  render: (node: unknown) => React.ReactNode
}

// Ordered registry. Order here == tab order in the UI.
const REGISTRY: Array<[string, RegistryEntry]> = [
  ["statement",          { title: "Statement",          render: (n) => <StatementSection node={n} /> }],
  ["problem",            { title: "Problem",            render: (n) => <ProblemSection node={n} /> }],
  ["solution",           { title: "Solution",           render: (n) => <SolutionSection node={n} /> }],
  ["gates",              { title: "Gates",              render: (n) => <GatesSection node={n} /> }],
  ["ownership",          { title: "Ownership",          render: (n) => <KeyValueSection node={n} /> }],
  ["evidence",           { title: "Evidence",           render: (n) => <EvidenceSection node={n} /> }],
  ["framework_mappings", { title: "Framework Mappings", render: (n) => <FrameworkMappingsSection node={n} /> }],
  ["aigp",               { title: "AIGP",               render: (n) => <KeyValueSection node={n} /> }],
  ["change_history",     { title: "History",            render: (n) => <ChangeHistorySection node={n} /> }],
]

const REGISTRY_KEYS = new Set(REGISTRY.map(([k]) => k))

function isEmptyNode(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === "object") return Object.keys(v as object).length === 0
  if (typeof v === "string") return v.trim() === ""
  return false
}

function humanizeKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getSectionEntries(principle: Record<string, unknown>): SectionEntry[] {
  const out: SectionEntry[] = []

  for (const [key, entry] of REGISTRY) {
    if (!(key in principle)) continue
    const node = principle[key]
    if (isEmptyNode(node)) continue
    out.push({ key, title: entry.title, content: entry.render(node) })
  }

  for (const key of Object.keys(principle)) {
    if (HEADER_KEYS.has(key) || REGISTRY_KEYS.has(key)) continue
    const node = principle[key]
    if (isEmptyNode(node)) continue
    out.push({
      key,
      title: humanizeKey(key),
      content: <UnknownSection node={node} />,
    })
  }

  return out
}
