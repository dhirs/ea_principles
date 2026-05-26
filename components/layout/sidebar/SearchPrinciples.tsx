"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function SearchPrinciples() {
  const { query, setQuery } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-search"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        Search
      </label>
      <input
        id="sidebar-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search principles…"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}
