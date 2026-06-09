"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { usePrinciples } from "@/lib/principles/PrinciplesContext"
import { asObject, asString, type Principle } from "@/lib/principles/types"

type Standard = { id: string; title: string }
type Group = { principleId: string; title: string | undefined; standards: Standard[] }

// Drop the "Pn — " prefix that pillar / focus_area strings carry, keep the label.
function label(value: unknown): string {
  const s = asString(value) ?? ""
  const m = s.match(/^P\w+\s*—\s*(.+)$/)
  return m ? m[1] : s
}

// Group the flat standards list by principle_id, preserving first-seen order.
function groupByPrinciple(rows: Principle[]): Group[] {
  const map = new Map<string, Group>()
  for (const p of rows) {
    const principleId = asString(p.principle_id)
    if (!principleId) continue
    const standardId = asString(p.standard_id)
    if (!standardId) continue
    let group = map.get(principleId)
    if (!group) {
      group = { principleId, title: asString(p.u_principle), standards: [] }
      map.set(principleId, group)
    }
    group.standards.push({
      id: standardId,
      title: asString(asObject(p.statement)?.title) ?? "(untitled)",
    })
  }
  return Array.from(map.values()).sort((a, b) =>
    a.principleId.localeCompare(b.principleId),
  )
}

export function PrincipleStandardsMap() {
  const { data, error } = usePrinciples()
  const [pillar, setPillar] = useState("")
  const [focusArea, setFocusArea] = useState("")

  const rows = useMemo(() => (data?.principles ?? []) as Principle[], [data])

  // Pillar options: every distinct pillar in the catalogue.
  const pillars = useMemo(() => {
    const set = new Set<string>()
    for (const p of rows) {
      const v = asString(p.pillar)
      if (v && v.trim()) set.add(v)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows])

  // Focus areas scoped to the selected pillar, so the dropdown only offers
  // focus areas that exist within it.
  const focusAreas = useMemo(() => {
    const set = new Set<string>()
    for (const p of rows) {
      if (pillar && asString(p.pillar) !== pillar) continue
      const v = asString(p.focus_area)
      if (v && v.trim()) set.add(v)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [rows, pillar])

  // If the active focus area isn't part of the selected pillar, drop it.
  useEffect(() => {
    if (focusArea && !focusAreas.includes(focusArea)) setFocusArea("")
  }, [focusArea, focusAreas])

  const groups = useMemo(() => {
    const filtered = rows.filter((p) => {
      if (pillar && asString(p.pillar) !== pillar) return false
      if (focusArea && asString(p.focus_area) !== focusArea) return false
      return true
    })
    return groupByPrinciple(filtered)
  }, [rows, pillar, focusArea])

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
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">All Principles</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Each principle and the standards that implement it.
      </p>

      {/* Filter panel */}
      <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect
            id="map-pillar"
            label="Pillar"
            value={pillar}
            onChange={setPillar}
            placeholder="All pillars"
            options={pillars}
          />
          <FilterSelect
            id="map-focus-area"
            label="Focus Area"
            value={focusArea}
            onChange={setFocusArea}
            placeholder="All focus areas"
            options={focusAreas}
          />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted-foreground">No principles match the selected filters.</p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li
              key={g.principleId}
              className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:grid-cols-[minmax(0,18rem)_1fr]"
            >
              {/* Principle: id + aspirational title */}
              <div className="space-y-1">
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {g.principleId}
                </div>
                {g.title && (
                  <p className="text-sm font-medium italic leading-snug text-foreground/80">
                    {g.title}
                  </p>
                )}
              </div>

              {/* Standards that implement it */}
              <ul className="space-y-1.5 md:border-l md:border-border md:pl-4">
                {g.standards.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/standards/${encodeURIComponent(s.id)}`}
                      className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.id}
                      </span>
                      <span className="text-foreground group-hover:underline">
                        {s.title}
                      </span>
                      <ArrowRight className="ml-auto size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterSelect({
  id,
  label: labelText,
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
        {labelText}
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
            {label(o)}
          </option>
        ))}
      </select>
    </div>
  )
}
