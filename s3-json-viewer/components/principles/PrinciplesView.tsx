"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { PrincipleView } from "./PrincipleView"

export function PrinciplesView() {
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
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

  return <PrincipleView principle={filtered[0]} />
}
