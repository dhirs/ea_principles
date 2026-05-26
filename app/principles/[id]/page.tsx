"use client"

import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { PrincipleView } from "@/components/principles/PrincipleView"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asString } from "@/lib/principles/types"

export default function PrinciplePage() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id)
  const { data, error } = usePrinciples()

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

  const principle = (data.principles ?? []).find(
    (p) => asString(p.principle_id) === id,
  )

  if (!principle) {
    return (
      <p className="text-muted-foreground">
        No principle found with id <span className="font-mono">{id}</span>.
      </p>
    )
  }

  return <PrincipleView principle={principle} />
}
