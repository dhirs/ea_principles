"use client"

import { useEffect, useState } from "react"
import type { HTMLAttributes } from "react"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { asArray, asObject, asString } from "@/lib/principles/types"
import { markdownComponents } from "@/components/principles/markdownComponents"

// Inline variant: drop the block <p> margins so markdown sits flush inside a
// list item (used for key_benefits, which are single inline strings).
const inlineMarkdownComponents = {
  ...markdownComponents,
  p: (props: HTMLAttributes<HTMLElement>) => <span {...props} />,
}

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

  // An RI implements a *standard*, so key the RI link off standard_id (unique
  // even when a principle later carries several standards). The /api/ri route
  // strips the ST- prefix to find the bare RI dir.
  const standardId = asString(principle?.standard_id)
  const [hasRi, setHasRi] = useState(false)

  // Show the Reference Implementation link only when a README actually exists
  // for this standard id (HEAD request against the RI route).
  useEffect(() => {
    if (!standardId) return
    let active = true
    fetch(`/api/ri/${encodeURIComponent(standardId)}`, { method: "HEAD" })
      .then((res) => {
        if (active) setHasRi(res.ok)
      })
      .catch(() => {
        if (active) setHasRi(false)
      })
    return () => {
      active = false
    }
  }, [standardId])

  if (!approach && benefits.length === 0 && !hasRi) return null

  return (
    <div className="space-y-4">
      {approach && (
        <div className="leading-relaxed text-foreground/90 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {approach}
          </ReactMarkdown>
        </div>
      )}
      {benefits.length > 0 && (
        <div>
          <div className="text-sm font-medium text-foreground/80 mb-2">Key benefits</div>
          <ul className="space-y-1.5 pl-5 list-disc text-sm leading-relaxed text-foreground/80">
            {benefits.map((b, i) => (
              <li key={i}>
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineMarkdownComponents}>
                  {b}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasRi && standardId && (
        <div className="pt-2">
          <Link
            href={`/standards/${encodeURIComponent(standardId)}/reference`}
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
