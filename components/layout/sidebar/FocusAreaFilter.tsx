"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function FocusAreaFilter() {
  const { focusArea, setFocusArea, focusAreas } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-focus-area"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Focus Area
      </label>
      <select
        id="sidebar-focus-area"
        value={focusArea}
        onChange={(e) => setFocusArea(e.target.value)}
        disabled={focusAreas.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All focus areas</option>
        {focusAreas.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  )
}
