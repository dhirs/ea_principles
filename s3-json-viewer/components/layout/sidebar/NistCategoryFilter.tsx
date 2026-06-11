"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function NistCategoryFilter() {
  const { nistCategory, setNistCategory, nistCategories } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-nist-category"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        NIST Category
      </label>
      <select
        id="sidebar-nist-category"
        value={nistCategory}
        onChange={(e) => setNistCategory(e.target.value)}
        disabled={nistCategories.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All NIST categories</option>
        {nistCategories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  )
}
