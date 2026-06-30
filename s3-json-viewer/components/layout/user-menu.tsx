"use client"

import { useEffect, useRef, useState } from "react"
import { LogOut, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape.
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

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="gap-2 font-semibold"
      >
        <User className="h-4 w-4" />
        Account
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </Button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {/* Sign out — plain form POST clears the cookie and redirects to /login */}
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
