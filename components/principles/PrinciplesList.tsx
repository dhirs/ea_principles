"use client"

import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asObject, asString } from "@/lib/principles/types"

export function PrinciplesList() {
  const { data, error, filtered, query } = usePrinciples()

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load principles: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (filtered.length === 0) {
    return (
      <p className="text-muted-foreground">
        {query ? `No principles match "${query}".` : "No principles found."}
      </p>
    )
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-semibold tracking-tight mb-4">All Principles</h1>
      <ul className="divide-y rounded-lg border bg-card shadow-sm">
        {filtered.map((p, i) => {
          const id = asString(p.principle_id) ?? `idx-${i}`
          const title = asString(asObject(p.statement)?.title) ?? "(untitled)"
          return (
            <li key={id}>
              <Link
                href={`/principles/${encodeURIComponent(id)}`}
                className="flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="font-mono text-sm text-muted-foreground">{id}</span>
                <span className="text-muted-foreground">-</span>
                <span className="font-medium">{title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
