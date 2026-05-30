"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Skeleton } from "@/components/ui/skeleton"
import { markdownComponents } from "@/components/principles/markdownComponents"

type State =
  | { status: "loading" }
  | { status: "ok"; content: string }
  | { status: "notFound" }
  | { status: "error"; message: string }

export default function ReferenceImplementationPage() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id)
  const [state, setState] = useState<State>({ status: "loading" })

  useEffect(() => {
    let active = true
    setState({ status: "loading" })
    fetch(`/api/ri/${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!active) return
        if (res.status === 404) return setState({ status: "notFound" })
        if (!res.ok) return setState({ status: "error", message: `Request failed (${res.status})` })
        const json = (await res.json()) as { content: string }
        setState({ status: "ok", content: json.content })
      })
      .catch((e) => {
        if (active) setState({ status: "error", message: String(e) })
      })
    return () => {
      active = false
    }
  }, [id])

  return (
    <article className="space-y-6 w-full">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Reference Implementation</div>
          <h1 className="font-mono text-2xl font-semibold">{id}</h1>
        </div>
        <Link
          href={`/principles/${encodeURIComponent(id)}`}
          className="text-sm text-primary underline-offset-4 hover:underline whitespace-nowrap"
        >
          ← Back to principle
        </Link>
      </div>

      <div className="rounded-2xl bg-card p-8 shadow-lg">
        {state.status === "loading" && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {state.status === "notFound" && (
          <p className="text-muted-foreground">
            No reference implementation found for <span className="font-mono">{id}</span>.
          </p>
        )}

        {state.status === "error" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            Failed to load reference implementation: {state.message}
          </div>
        )}

        {state.status === "ok" && (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {state.content}
          </ReactMarkdown>
        )}
      </div>
    </article>
  )
}
