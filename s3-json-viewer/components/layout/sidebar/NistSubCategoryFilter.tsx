"use client"

import { usePrinciples } from "@/lib/principles/PrinciplesContext"

export function NistSubCategoryFilter() {
  const { nistSubcategory, setNistSubcategory, nistSubcategories } = usePrinciples()

  return (
    <div className="space-y-1.5">
      <label
        htmlFor="sidebar-nist-subcategory"
        className="block px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
      >
        NIST Subcategory
      </label>
      <select
        id="sidebar-nist-subcategory"
        value={nistSubcategory}
        onChange={(e) => setNistSubcategory(e.target.value)}
        disabled={nistSubcategories.length === 0}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        <option value="">All NIST subcategories</option>
        {nistSubcategories.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}
