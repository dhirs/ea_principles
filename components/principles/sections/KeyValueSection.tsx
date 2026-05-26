import { asObject } from "@/lib/principles/types"

function formatKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return JSON.stringify(v)
}

export function KeyValueSection({ node }: { node: unknown }) {
  const o = asObject(node)
  if (!o) return null
  const entries = Object.entries(o)
  if (entries.length === 0) return null
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{formatKey(k)}</dt>
          <dd className="mt-0.5 text-foreground/90">{formatValue(v)}</dd>
        </div>
      ))}
    </dl>
  )
}
