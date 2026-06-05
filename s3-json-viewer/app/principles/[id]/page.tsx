"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { PrincipleView } from "@/components/principles/PrincipleView"
import type { Principle } from "@/lib/principles/types"

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "not-found" }
  | { status: "ready"; principle: Principle }

export default function PrinciplePage() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id)
  const [state, setState] = useState<State>({ status: "loading" })

  // Fetch only this principle's full record (not the whole catalogue).
  useEffect(() => {
    let active = true
    setState({ status: "loading" })
    fetch(`/api/data/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (active) setState({ status: "not-found" })
          return
        }
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        const principle = (await r.json()) as Principle
        if (active) setState({ status: "ready", principle })
      })
      .catch((e) => {
        if (active)
          setState({ status: "error", message: e instanceof Error ? e.message : String(e) })
      })
    return () => {
      active = false
    }
  }, [id])

  if (state.status === "error") {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load principle: {state.message}
      </div>
    )
  }

  if (state.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (state.status === "not-found") {
    return (
      <p className="text-muted-foreground">
        No principle found with id <span className="font-mono">{id}</span>.
      </p>
    )
  }

  return <PrincipleView principle={state.principle} />
}
