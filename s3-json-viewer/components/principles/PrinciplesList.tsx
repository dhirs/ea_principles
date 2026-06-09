"use client"

import { useState } from "react"
import Link from "next/link"
import { LayoutGrid, List as ListIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asObject, asString } from "@/lib/principles/types"
import { cn } from "@/lib/utils"

type View = "grid" | "list"

// Drop the "Pn — " prefix that pillar / focus_area strings carry, keep the label.
function label(value: unknown): string | null {
  const s = asString(value)
  if (!s) return null
  const m = s.match(/^P\w+\s*—\s*(.+)$/)
  return m ? m[1] : s
}

export function PrinciplesList() {
  const { data, error, filtered, query } = usePrinciples()
  const [view, setView] = useState<View>("grid")

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
        Failed to load principles: {error}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
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
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">All Principles</h1>
        <div className="inline-flex rounded-lg border bg-card p-0.5 shadow-sm">
          <ViewToggle
            active={view === "grid"}
            onClick={() => setView("grid")}
            label="Grid view"
          >
            <LayoutGrid className="size-4" />
          </ViewToggle>
          <ViewToggle
            active={view === "list"}
            onClick={() => setView("list")}
            label="List view"
          >
            <ListIcon className="size-4" />
          </ViewToggle>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p, i) => {
            const id = asString(p.standard_id) ?? `idx-${i}`
            const statement = asObject(p.statement)
            const title = asString(statement?.title) ?? "(untitled)"
            const description = asString(statement?.description)
            const pillar = label(p.pillar)
            const focus = label(p.focus_area)
            return (
              <Link
                key={id}
                href={`/standards/${encodeURIComponent(id)}`}
                className="group focus-visible:outline-none"
              >
                <Card className="h-full gap-3 py-4 transition-all hover:ring-foreground/20 hover:shadow-md group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardHeader className="gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{id}</span>
                      {pillar && (
                        <Badge variant="secondary" className="max-w-[60%] truncate">
                          {pillar}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-3">{title}</CardTitle>
                  </CardHeader>
                  {(description || focus) && (
                    <CardContent className="flex flex-1 flex-col justify-between gap-3">
                      {description && (
                        <p className="line-clamp-3 text-sm text-muted-foreground">
                          {description}
                        </p>
                      )}
                      {focus && (
                        <Badge variant="outline" className="w-fit">
                          {focus}
                        </Badge>
                      )}
                    </CardContent>
                  )}
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <ul className="divide-y rounded-lg border bg-card shadow-sm">
          {filtered.map((p, i) => {
            const id = asString(p.standard_id) ?? `idx-${i}`
            const title = asString(asObject(p.statement)?.title) ?? "(untitled)"
            return (
              <li key={id}>
                <Link
                  href={`/standards/${encodeURIComponent(id)}`}
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
      )}
    </div>
  )
}

function ViewToggle({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  )
}
