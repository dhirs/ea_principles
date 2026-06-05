"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { asArray, asObject, asString, type Principle, type PrinciplesPayload } from "./types"

function getAwsBestPractices(p: Principle): string[] {
  const refs = asArray(asObject(asObject(p.framework_mappings)?.aws)?.references) ?? []
  return refs
    .map((r) => asString(asObject(r)?.best_practice))
    .filter((s): s is string => !!s && !!s.trim())
}

type PrinciplesContextValue = {
  data: PrinciplesPayload | null
  error: string | null
  query: string
  setQuery: (q: string) => void
  pillar: string
  setPillar: (p: string) => void
  pillars: string[]
  focusArea: string
  setFocusArea: (f: string) => void
  focusAreas: string[]
  bestPractice: string
  setBestPractice: (b: string) => void
  bestPractices: string[]
  maturityLevel: string
  setMaturityLevel: (m: string) => void
  maturityLevels: string[]
  filtered: Principle[]
}

const PrinciplesContext = createContext<PrinciplesContextValue | null>(null)

export function PrinciplesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PrinciplesPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pillar, setPillar] = useState("")
  const [focusArea, setFocusArea] = useState("")
  const [bestPractice, setBestPractice] = useState("")
  const [maturityLevel, setMaturityLevel] = useState("")

  useEffect(() => {
    // Lightweight list (id/title/pillar/focus/maturity/best-practices) for the
    // list page + sidebar filters. Full principle is fetched per-detail-page.
    fetch("/api/index")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const [pillars, focusAreas, bestPractices, maturityLevels] = useMemo(() => {
    const principles = data?.principles ?? []
    const pillarSet = new Set<string>()
    const focusSet = new Set<string>()
    const bpSet = new Set<string>()
    const maturitySet = new Set<string>()
    for (const p of principles) {
      const pv = asString(p.pillar)
      if (pv && pv.trim()) pillarSet.add(pv)
      // Scope focus areas to the selected pillar so the dropdown only offers
      // focus areas that exist within it.
      if (!pillar || pv === pillar) {
        const fv = asString(p.focus_area)
        if (fv && fv.trim()) focusSet.add(fv)
      }
      for (const bp of getAwsBestPractices(p)) bpSet.add(bp)
      const mv = asString(p.maturity_level)
      if (mv && mv.trim()) maturitySet.add(mv)
    }
    const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b))
    return [sort(pillarSet), sort(focusSet), sort(bpSet), sort(maturitySet)]
  }, [data, pillar])

  // If the active focus area isn't part of the selected pillar, drop it.
  useEffect(() => {
    if (focusArea && !focusAreas.includes(focusArea)) setFocusArea("")
  }, [focusArea, focusAreas])

  const filtered = useMemo(() => {
    const principles = data?.principles ?? []
    const q = query.trim().toLowerCase()
    return principles.filter((p) => {
      if (pillar && asString(p.pillar) !== pillar) return false
      if (focusArea && asString(p.focus_area) !== focusArea) return false
      if (bestPractice && !getAwsBestPractices(p).includes(bestPractice)) return false
      if (maturityLevel && asString(p.maturity_level) !== maturityLevel) return false
      if (!q) return true
      const title = asString(asObject(p.statement)?.title) ?? ""
      const id = asString(p.principle_id) ?? ""
      return title.toLowerCase().includes(q) || id.toLowerCase().includes(q)
    })
  }, [data, query, pillar, focusArea, bestPractice, maturityLevel])

  const value = useMemo(
    () => ({
      data,
      error,
      query,
      setQuery,
      pillar,
      setPillar,
      pillars,
      focusArea,
      setFocusArea,
      focusAreas,
      bestPractice,
      setBestPractice,
      bestPractices,
      maturityLevel,
      setMaturityLevel,
      maturityLevels,
      filtered,
    }),
    [data, error, query, pillar, pillars, focusArea, focusAreas, bestPractice, bestPractices, maturityLevel, maturityLevels, filtered],
  )

  return <PrinciplesContext.Provider value={value}>{children}</PrinciplesContext.Provider>
}

export function usePrinciples() {
  const ctx = useContext(PrinciplesContext)
  if (!ctx) throw new Error("usePrinciples must be used within a PrinciplesProvider")
  return ctx
}
