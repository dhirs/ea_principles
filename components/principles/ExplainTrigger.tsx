"use client"

import { useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import type { Principle } from "@/lib/principles/types"

const INDUSTRY_GROUPS: Array<{ label: string; options: string[] }> = [
  {
    label: "Insurance",
    options: [
      "Insurance — Life & Pensions",
      "Insurance — Motor",
      "Insurance — Home / Property",
      "Insurance — Health",
      "Insurance — Commercial & Specialty",
      "Insurance — Reinsurance",
    ],
  },
  {
    label: "Banking & Financial Services",
    options: [
      "Retail Banking",
      "Corporate Banking",
      "Investment Banking",
      "Private Banking / Wealth Management",
      "Asset Management",
      "Capital Markets",
      "Payments & Cards",
      "Mortgages & Lending",
      "Consumer Credit / BNPL",
      "Fintech / Neobank",
      "Crypto / Digital Assets",
    ],
  },
  {
    label: "Healthcare & Life Sciences",
    options: [
      "Hospital / Provider",
      "Health Payor",
      "Pharma / Biotech",
      "Medical Devices",
      "Telehealth / Digital Health",
      "Clinical Research / CRO",
    ],
  },
  {
    label: "Retail & Consumer",
    options: [
      "E-Commerce — Marketplace",
      "E-Commerce — D2C",
      "Grocery / Supermarket",
      "Fashion & Apparel",
      "Luxury / Specialty Retail",
      "Quick Commerce",
      "Consumer Packaged Goods (CPG)",
    ],
  },
  {
    label: "Travel & Hospitality",
    options: [
      "Airlines",
      "Hotels",
      "Online Travel Agencies (OTA)",
      "Cruise / Tour Operators",
      "Ride-hailing / Mobility",
    ],
  },
  {
    label: "Telco, Media & Entertainment",
    options: [
      "Telecom Carriers",
      "Media & Streaming",
      "Publishing",
      "Gaming",
      "Adtech / Marketing",
    ],
  },
  {
    label: "Education",
    options: [
      "K-12 Education",
      "Higher Education",
      "Edtech / Online Learning",
      "Corporate Learning & Development",
    ],
  },
  {
    label: "Manufacturing & Industrial",
    options: [
      "Discrete Manufacturing",
      "Process Manufacturing",
      "Automotive OEM",
      "Aerospace & Defense",
      "Industrial IoT",
    ],
  },
  {
    label: "Energy & Utilities",
    options: ["Oil & Gas", "Power & Utilities", "Renewables"],
  },
  {
    label: "Logistics & Supply Chain",
    options: [
      "Freight / 3PL",
      "Warehousing & Fulfilment",
      "Last-mile Delivery",
      "Maritime Shipping",
    ],
  },
  {
    label: "Public Sector",
    options: [
      "Tax & Revenue",
      "Welfare & Benefits",
      "Defense & Intelligence",
      "Law Enforcement",
      "Civic / Smart Cities",
    ],
  },
  {
    label: "Real Estate & PropTech",
    options: [
      "Residential Real Estate",
      "Commercial Real Estate",
      "Property Management",
    ],
  },
  {
    label: "Agriculture & Food",
    options: ["Agritech", "Food & Beverage", "Restaurants / QSR"],
  },
  {
    label: "Professional Services",
    options: ["Legal", "Consulting & Audit", "HR / Recruiting"],
  },
]

const DEFAULT_INDUSTRY = INDUSTRY_GROUPS[0].options[0]

const IMPLEMENTATION_TYPES = ["RAG", "Agent", "LLM Only", "ML"] as const

type ExplainResponse = {
  use_case_background: string
  issue_detail: string
}

export function ExplainTrigger({ principle }: { principle: Principle }) {
  const [open, setOpen] = useState(false)
  const [industry, setIndustry] = useState<string>(DEFAULT_INDUSTRY)
  const [implType, setImplType] = useState<string>(IMPLEMENTATION_TYPES[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExplainResponse | null>(null)

  const reset = () => {
    setLoading(false)
    setError(null)
    setResult(null)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) reset()
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          principle,
          industry,
          implementation_type: implType,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error ?? `${res.status} ${res.statusText}`)
      }
      setResult({
        use_case_background: data.use_case_background ?? "",
        issue_detail: data.issue_detail ?? "",
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger
        render={
          <Button variant="outline" size="sm">
            Explain
          </Button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50 data-[open]:animate-in data-[open]:fade-in data-[closed]:animate-out data-[closed]:fade-out" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(1200px,96vw)] h-[92vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-8 shadow-2xl outline-none">
          <Dialog.Title className="text-lg font-semibold">
            Explain this principle with an example
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Pick an industry and an AI implementation type. We&apos;ll generate a concrete failure scenario.
          </Dialog.Description>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="explain-industry" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Industry
              </label>
              <select
                id="explain-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {INDUSTRY_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="explain-impl" className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Implementation Type
              </label>
              <select
                id="explain-impl"
                value={implType}
                onChange={(e) => setImplType(e.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {IMPLEMENTATION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading && (
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                  <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
              {loading ? "Generating…" : result ? "Regenerate" : "Generate"}
            </Button>
            <Dialog.Close
              render={
                <Button variant="ghost" disabled={loading}>
                  Close
                </Button>
              }
            />
          </div>

          {loading && (
            <div className="mt-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <svg
                className="size-10 animate-spin text-foreground/70"
                viewBox="0 0 24 24"
                fill="none"
                role="status"
                aria-label="Generating"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
                <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <p className="text-sm">Generating example…</p>
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {!loading && result && (
            <div className="mt-6 space-y-5 text-sm">
              {result.use_case_background && (
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    Use case background
                  </h3>
                  <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {result.use_case_background}
                  </p>
                </section>
              )}
              {result.issue_detail && (
                <section>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                    What went wrong
                  </h3>
                  <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {result.issue_detail}
                  </p>
                </section>
              )}
            </div>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
