"use client"

import { useEffect, useMemo, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

type Field = Record<string, unknown> & { name?: string }

// One row of the schema tree. `depth` drives indentation: 0 = a top-level
// principle field, 1 = a child node parsed out of that field's `structure`.
type Node = {
  path: string
  depth: number
  type?: string
  required?: boolean
  format?: string
  description?: string
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : JSON.stringify(v)
}

// Parse an inline structure string like "{ title: string, description: string }"
// into its child field names + types. Returns [] when there's nothing to expand.
function parseStructure(structure: unknown): { name: string; type: string }[] {
  if (typeof structure !== "string") return []
  const inner = structure.trim().replace(/^\{/, "").replace(/\}$/, "").trim()
  if (!inner) return []
  return inner
    .split(",")
    .map((part) => {
      const idx = part.indexOf(":")
      if (idx === -1) return null
      return { name: part.slice(0, idx).trim(), type: part.slice(idx + 1).trim() }
    })
    .filter((c): c is { name: string; type: string } => !!c && !!c.name)
}

// Flatten principle_schema.fields into dot-path nodes. Each field is a level-1
// node (<level1>); object/array fields with an inline structure expand into
// their child nodes (<level1>.<level2>, or <level1>[].<level2> for arrays).
function toNodes(fields: Field[]): Node[] {
  const nodes: Node[] = []
  for (const field of fields) {
    const name = asString(field.name ?? "")
    if (!name) continue
    nodes.push({
      path: name,
      depth: 0,
      type: typeof field.type === "string" ? field.type : undefined,
      required: typeof field.required === "boolean" ? field.required : undefined,
      format: typeof field.format === "string" ? field.format : undefined,
      description:
        typeof field.description === "string" ? field.description : undefined,
    })
    const isArray = field.type === "array"
    const children = parseStructure(field.structure ?? field.item_structure)
    const sep = isArray ? "[]." : "."
    for (const child of children) {
      nodes.push({ path: `${name}${sep}${child.name}`, depth: 1, type: child.type })
    }
  }
  return nodes
}

type State =
  | { status: "loading" }
  | { status: "ok"; nodes: Node[] }
  | { status: "error"; message: string }

export default function TaxonomyPage() {
  const [state, setState] = useState<State>({ status: "loading" })
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    setState({ status: "loading" })
    fetch("/api/taxonomy")
      .then(async (res) => {
        if (!active) return
        const json = await res.json()
        if (!res.ok) {
          return setState({
            status: "error",
            message: json?.details || json?.error || `Request failed (${res.status})`,
          })
        }
        const fields = json?.principle_schema?.fields
        setState({ status: "ok", nodes: toNodes(Array.isArray(fields) ? fields : []) })
      })
      .catch((e) => {
        if (active) setState({ status: "error", message: String(e) })
      })
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    if (state.status !== "ok") return []
    const q = query.trim().toLowerCase()
    if (!q) return state.nodes
    return state.nodes.filter(
      (n) =>
        n.path.toLowerCase().includes(q) ||
        (n.description ?? "").toLowerCase().includes(q),
    )
  }, [state, query])

  return (
    <article className="space-y-6 w-full">
      <div>
        <div className="text-sm text-muted-foreground">Schema</div>
        <h1 className="text-2xl font-semibold">Taxonomy</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every field a principle can carry, from{" "}
          <span className="font-mono">principle_schema.json</span>, shown as its{" "}
          <span className="font-mono">level1.level2</span> node path so you can see which field
          is what.
        </p>
      </div>

      {state.status === "ok" && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter fields…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      )}

      <div className="rounded-2xl bg-card p-6 shadow-lg">
        {state.status === "loading" && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-1/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            Failed to load schema: {state.message}
          </div>
        )}

        {state.status === "ok" && (
          <>
            <div className="mb-4 text-xs text-muted-foreground">
              {filtered.length} of {state.nodes.length} nodes
            </div>
            <div className="space-y-1">
              {filtered.map((node, i) => (
                <div
                  key={`${node.path}-${i}`}
                  className={node.depth === 0 ? "pt-3" : ""}
                  style={{ paddingLeft: node.depth * 20 }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span
                      className={`font-mono break-all ${
                        node.depth === 0
                          ? "text-base font-semibold text-primary"
                          : "text-sm text-foreground/80"
                      }`}
                    >
                      {node.path}
                    </span>
                    {node.type && (
                      <span className="font-mono text-xs text-muted-foreground">{node.type}</span>
                    )}
                    {node.required && (
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                        required
                      </span>
                    )}
                    {node.format && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {node.format}
                      </span>
                    )}
                  </div>
                  {node.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {node.description}
                    </p>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">No matching fields.</p>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  )
}
