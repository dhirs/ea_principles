"use client"

import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Skeleton } from "@/components/ui/skeleton"
import { markdownComponents } from "@/components/principles/markdownComponents"

type Entry = {
  title?: string
  reason?: string
  pillar?: string
  focus_area?: string
  bp?: string
  step?: string | null
  status?: string
}

type State =
  | { status: "loading" }
  | { status: "ok"; entries: Entry[] }
  | { status: "error"; message: string }

const uniq = (xs: (string | undefined)[]) =>
  [...new Set(xs.filter((x): x is string => !!x))].sort()

export default function NotPromotedPage() {
  const [state, setState] = useState<State>({ status: "loading" })
  const [pillar, setPillar] = useState("")
  const [focusArea, setFocusArea] = useState("")
  const [bp, setBp] = useState("")
  const [page, setPage] = useState(1)

  const PAGE_SIZE = 10

  useEffect(() => {
    let active = true
    setState({ status: "loading" })
    fetch("/api/not-promoted")
      .then(async (res) => {
        if (!active) return
        const json = await res.json()
        if (!res.ok) {
          return setState({
            status: "error",
            message: json?.details || json?.error || `Request failed (${res.status})`,
          })
        }
        const list = Array.isArray(json?.not_promoted) ? json.not_promoted : []
        setState({ status: "ok", entries: list })
      })
      .catch((e) => {
        if (active) setState({ status: "error", message: String(e) })
      })
    return () => {
      active = false
    }
  }, [])

  const entries = state.status === "ok" ? state.entries : []

  // Cascading option lists: Focus Area is scoped to the chosen Pillar; BP is
  // scoped to the chosen Pillar + Focus Area.
  const pillarOpts = useMemo(() => uniq(entries.map((e) => e.pillar)), [entries])
  const focusOpts = useMemo(
    () => uniq(entries.filter((e) => !pillar || e.pillar === pillar).map((e) => e.focus_area)),
    [entries, pillar],
  )
  const bpOpts = useMemo(
    () =>
      uniq(
        entries
          .filter((e) => !pillar || e.pillar === pillar)
          .filter((e) => !focusArea || e.focus_area === focusArea)
          .map((e) => e.bp),
      ),
    [entries, pillar, focusArea],
  )

  // Drop a downstream selection when it falls outside the narrowed options.
  useEffect(() => {
    if (focusArea && !focusOpts.includes(focusArea)) setFocusArea("")
  }, [focusArea, focusOpts])
  useEffect(() => {
    if (bp && !bpOpts.includes(bp)) setBp("")
  }, [bp, bpOpts])

  const filtered = useMemo(
    () =>
      entries
        .filter((e) => !pillar || e.pillar === pillar)
        .filter((e) => !focusArea || e.focus_area === focusArea)
        .filter((e) => !bp || e.bp === bp),
    [entries, pillar, focusArea, bp],
  )

  // Reset to the first page whenever the result set changes.
  useEffect(() => {
    setPage(1)
  }, [pillar, focusArea, bp])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  return (
    <article className="space-y-6 w-full">
      <div>
        <div className="text-sm text-muted-foreground">Ledger</div>
        <h1 className="text-2xl font-semibold">Not promoted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AWS principles that were walked but not promoted to a standard, with the reason for each.
        </p>
      </div>

      {state.status === "ok" && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FilterSelect
              id="np-pillar"
              label="Pillar"
              placeholder="All pillars"
              value={pillar}
              onChange={setPillar}
              options={pillarOpts}
            />
            <FilterSelect
              id="np-focus"
              label="Focus Area"
              placeholder="All focus areas"
              value={focusArea}
              onChange={setFocusArea}
              options={focusOpts}
            />
            <FilterSelect
              id="np-bp"
              label="BP Node"
              placeholder="All BP nodes"
              value={bp}
              onChange={setBp}
              options={bpOpts}
            />
          </div>
          <div className="mt-3 px-1 text-xs text-muted-foreground">
            {filtered.length} of {entries.length}
            {(pillar || focusArea || bp) && (
              <button
                type="button"
                onClick={() => {
                  setPillar("")
                  setFocusArea("")
                  setBp("")
                }}
                className="ml-3 underline hover:text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {state.status === "loading" && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-2xl bg-card p-6 shadow-sm">
              <Skeleton className="mb-3 h-5 w-1/3" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ))}
        </div>
      )}

      {state.status === "error" && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {state.message}
        </div>
      )}

      {state.status === "ok" && filtered.length === 0 && (
        <div className="rounded-2xl bg-card p-6 text-sm text-muted-foreground shadow-sm">
          No entries match the selected filters.
        </div>
      )}

      {state.status === "ok" &&
        pageItems.map((e, i) => {
          const tag = [e.pillar, e.bp, e.step ? `step ${e.step}` : null]
            .filter(Boolean)
            .join(" · ")
          return (
            <section key={(currentPage - 1) * PAGE_SIZE + i} className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold tracking-tight">
                {e.title || "(untitled)"}
              </h2>
              {tag && (
                <div className="mt-1 font-mono text-xs text-muted-foreground">{tag}</div>
              )}
              {e.reason && (
                <div className="mt-3 text-sm text-foreground/90">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {e.reason}
                  </ReactMarkdown>
                </div>
              )}
            </section>
          )
        })}

      {state.status === "ok" && filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-background"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-background"
          >
            Next
          </button>
        </div>
      )}
    </article>
  )
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: string[]
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={options.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
