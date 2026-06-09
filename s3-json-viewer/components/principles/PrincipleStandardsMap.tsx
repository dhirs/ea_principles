"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asObject, asString, type Principle } from "@/lib/principles/types"

type Standard = { id: string; title: string }
type Group = { principleId: string; title: string | undefined; standards: Standard[] }

// Group the flat standards list by principle_id, preserving first-seen order.
function groupByPrinciple(rows: Principle[]): Group[] {
  const map = new Map<string, Group>()
  for (const p of rows) {
    const principleId = asString(p.principle_id)
    if (!principleId) continue
    const standardId = asString(p.standard_id)
    if (!standardId) continue
    let group = map.get(principleId)
    if (!group) {
      group = { principleId, title: asString(p.u_principle), standards: [] }
      map.set(principleId, group)
    }
    group.standards.push({
      id: standardId,
      title: asString(asObject(p.statement)?.title) ?? "(untitled)",
    })
  }
  return Array.from(map.values()).sort((a, b) =>
    a.principleId.localeCompare(b.principleId),
  )
}

export function PrincipleStandardsMap() {
  const { data, error } = usePrinciples()

  const groups = useMemo(
    () => groupByPrinciple((data?.principles ?? []) as Principle[]),
    [data],
  )

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load principles: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (groups.length === 0) {
    return <p className="text-muted-foreground">No principles found.</p>
  }

  return (
    <div className="w-full">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">All Principles</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Each principle and the standards that implement it.
      </p>

      <ul className="space-y-4">
        {groups.map((g) => (
          <li
            key={g.principleId}
            className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[minmax(0,18rem)_1fr]"
          >
            {/* Principle: id + aspirational title */}
            <div className="space-y-1">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {g.principleId}
              </div>
              {g.title && (
                <p className="text-sm font-medium italic leading-snug text-foreground/80">
                  {g.title}
                </p>
              )}
            </div>

            {/* Standards that implement it */}
            <ul className="space-y-1.5 md:border-l md:border-border md:pl-4">
              {g.standards.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/standards/${encodeURIComponent(s.id)}`}
                    className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {s.id}
                    </span>
                    <span className="text-foreground group-hover:underline">
                      {s.title}
                    </span>
                    <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
