"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RefreshButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await fetch("/api/refresh", { method: "POST", cache: "no-store" })
    } catch {
      // fall through — reload regardless so user still gets fresh page
    }
    window.location.reload()
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing…" : "Refresh"}
    </Button>
  )
}
