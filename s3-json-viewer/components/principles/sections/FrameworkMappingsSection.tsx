"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { asArray, asObject } from "@/lib/principles/types"

const FRAMEWORK_LABELS: Record<string, string> = {
  aws: "AWS",
  aigp: "AIGP",
  eu_ai_act: "EU AI Act",
  nist: "NIST",
  gdpr: "GDPR",
  fca: "FCA",
  owasp: "OWASP",
}

function frameworkLabel(k: string) {
  return FRAMEWORK_LABELS[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function humanizeKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return JSON.stringify(v, null, 2)
}

function ReferenceCard({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data)
  return (
    <div className="rounded-xl bg-card p-5 shadow-md">
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground sm:pt-0.5 font-mono">
              {humanizeKey(k)}
            </dt>
            <dd className="text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
              {formatValue(v)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function FrameworkMappingsSection({ node }: { node: unknown }) {
  const obj = asObject(node)
  if (!obj) return null
  const frameworks = Object.entries(obj)
  if (frameworks.length === 0) return null

  return (
    <Tabs orientation="vertical" defaultValue={frameworks[0][0]}>
      <TabsList className="w-40 shrink-0 h-fit gap-1 shadow-md bg-card">
        {frameworks.map(([fw]) => (
          <TabsTrigger key={fw} value={fw}>
            {frameworkLabel(fw)}
          </TabsTrigger>
        ))}
      </TabsList>
      {frameworks.map(([fw, val]) => {
        const fwObj = asObject(val) ?? {}
        const refs = asArray(fwObj.references) ?? []
        return (
          <TabsContent key={fw} value={fw} className="min-w-0">
            {refs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No references.</p>
            ) : (
              <div className="space-y-3">
                {refs.map((raw, i) => {
                  const r = asObject(raw)
                  if (!r) return null
                  return <ReferenceCard key={i} data={r} />
                })}
              </div>
            )}
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
