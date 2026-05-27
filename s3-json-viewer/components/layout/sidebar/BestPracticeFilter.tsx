"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function BestPracticeFilter() {
  const { bestPractice, setBestPractice, bestPractices } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-best-practice"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        AWS Best Practice
      </label>
      <select
        id="sidebar-best-practice"
        value={bestPractice}
        onChange={(e) => setBestPractice(e.target.value)}
        disabled={bestPractices.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All best practices</option>
        {bestPractices.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>
    </div>
  )
}
