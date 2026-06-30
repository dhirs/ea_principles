"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"

// Domains the catalogue will cover. Only `available` ones are selectable;
// the rest render as disabled "Soon" rows. Add a domain by flipping `available`
// (and later wiring the selection to a filter/route).
type Domain = { id: string; label: string; available: boolean }

const DOMAINS: Domain[] = [
  { id: "genai", label: "GenAI", available: true },
  { id: "ml", label: "Machine Learning", available: false },
]

export function DomainSelector() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("genai")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const current = DOMAINS.find((d) => d.id === selected)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <span className="text-muted-foreground">Domain:</span>
        {current?.label}
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {DOMAINS.map((d) => {
            const isSelected = d.id === selected
            return (
              <button
                key={d.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={!d.available}
                onClick={() => {
                  if (!d.available) return
                  setSelected(d.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  d.available
                    ? "cursor-pointer text-foreground hover:bg-muted"
                    : "cursor-not-allowed text-muted-foreground"
                }`}
              >
                <span className="flex items-center gap-2">
                  {d.label}
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </span>
                {!d.available && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Soon
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
