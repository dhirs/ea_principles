"use client"

import { useMemo } from "react"
import Link from "next/link"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asString } from "@/lib/principles/types"

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export default function Home() {
  const { data, error } = usePrinciples()

  const summary = useMemo(() => {
    const principles = data?.principles ?? []
    const counts = new Map<string, number>()
    let lastUpdated = ""
    for (const p of principles) {
      const pillar = asString(p.pillar)?.trim() || "Unassigned"
      counts.set(pillar, (counts.get(pillar) ?? 0) + 1)
      const date = asString(p.last_updated)
      if (date && date > lastUpdated) lastUpdated = date
    }
    const rows = Array.from(counts.entries())
      .map(([pillar, count]) => ({ pillar, count }))
      .sort((a, b) => b.count - a.count || a.pillar.localeCompare(b.pillar))
    return { total: principles.length, rows, lastUpdated }
  }, [data])

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">
          A snapshot of the standards catalogue.
        </p>
      </header>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Failed to load standards: {error}
        </div>
      ) : !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total Standards" value={String(summary.total)} />
            <StatCard label="Pillars" value={String(summary.rows.length)} />
            <StatCard
              label="Last Updated"
              value={summary.lastUpdated ? formatDate(summary.lastUpdated) : "—"}
            />
          </div>

          {/* Per-pillar table */}
          <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Standards per Pillar
              </h2>
              <Link
                href="/standards"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Pillar</th>
                  <th className="px-6 py-3 font-medium text-right">Standards</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">Share</th>
                </tr>
              </thead>
              <tbody>
                {summary.rows.map(({ pillar, count }) => {
                  const pct = summary.total ? Math.round((count / summary.total) * 100) : 0
                  return (
                    <tr key={pillar} className="border-t border-border">
                      <td className="px-6 py-3 font-medium text-foreground">{pillar}</td>
                      <td className="px-6 py-3 text-right font-mono tabular-nums">{count}</td>
                      <td className="hidden px-6 py-3 sm:table-cell">
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-6 py-3 font-semibold text-foreground">Total</td>
                  <td className="px-6 py-3 text-right font-mono font-semibold tabular-nums">
                    {summary.total}
                  </td>
                  <td className="hidden px-6 py-3 sm:table-cell" />
                </tr>
              </tfoot>
            </table>
          </section>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</div>
    </div>
  )
}
