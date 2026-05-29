"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function MaturityFilter() {
  const { maturityLevel, setMaturityLevel, maturityLevels } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-maturity"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Maturity Level
      </label>
      <select
        id="sidebar-maturity"
        value={maturityLevel}
        onChange={(e) => setMaturityLevel(e.target.value)}
        disabled={maturityLevels.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All maturity levels</option>
        {maturityLevels.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}
