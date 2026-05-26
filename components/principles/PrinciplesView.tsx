"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import type { PrinciplesPayload } from "@/lib/principles/types"
import { PrincipleView } from "./PrincipleView"

export function PrinciplesView() {
  const [data, setData] = useState<PrinciplesPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/data")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

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

  const principles = data.principles ?? []

  if (principles.length === 0) {
    return <p className="text-muted-foreground">No principles found.</p>
  }

  return <PrincipleView principle={principles[0]} />
}
