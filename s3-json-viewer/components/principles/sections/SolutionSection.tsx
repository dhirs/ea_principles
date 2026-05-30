"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { asArray, asObject, asString } from "@/lib/principles/types"

export function SolutionSection({
  node,
  principle,
}: {
  node: unknown
  principle?: Record<string, unknown>
}) {
  const o = asObject(node)
  const approach = asString(o?.approach)
  const benefits = asArray(o?.key_benefits)?.filter((x): x is string => typeof x === "string") ?? []

  const principleId = asString(principle?.principle_id)
  const [hasRi, setHasRi] = useState(false)

  // Show the Reference Implementation link only when a README actually exists
  // for this principle id (HEAD request against the RI route).
  useEffect(() => {
    if (!principleId) return
    let active = true
    fetch(`/api/ri/${encodeURIComponent(principleId)}`, { method: "HEAD" })
      .then((res) => {
        if (active) setHasRi(res.ok)
      })
      .catch(() => {
        if (active) setHasRi(false)
      })
    return () => {
      active = false
    }
  }, [principleId])

  if (!approach && benefits.length === 0 && !hasRi) return null

  return (
    <div className="space-y-4">
      {approach && (
        <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">{approach}</p>
      )}
      {benefits.length > 0 && (
        <div>
          <div className="text-sm font-medium text-foreground/80 mb-2">Key benefits</div>
          <ul className="space-y-1.5 pl-5 list-disc text-sm leading-relaxed text-foreground/80">
            {benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
      {hasRi && principleId && (
        <div className="pt-2">
          <Link
            href={`/principles/${encodeURIComponent(principleId)}/reference`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            Reference Implementation
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
