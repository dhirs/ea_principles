"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function PillarFilter() {
  const { pillar, setPillar, pillars } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-pillar"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Pillar
      </label>
      <select
        id="sidebar-pillar"
        value={pillar}
        onChange={(e) => setPillar(e.target.value)}
        disabled={pillars.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All pillars</option>
        {pillars.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  )
}
