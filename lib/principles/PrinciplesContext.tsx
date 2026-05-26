"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { asObject, asString, type Principle, type PrinciplesPayload } from "./types"

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
  filtered: Principle[]
}

const PrinciplesContext = createContext<PrinciplesContextValue | null>(null)

export function PrinciplesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PrinciplesPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pillar, setPillar] = useState("")
  const [focusArea, setFocusArea] = useState("")

  useEffect(() => {
    fetch("/api/data")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const [pillars, focusAreas] = useMemo(() => {
    const principles = data?.principles ?? []
    const pillarSet = new Set<string>()
    const focusSet = new Set<string>()
    for (const p of principles) {
      const pv = asString(p.pillar)
      if (pv && pv.trim()) pillarSet.add(pv)
      const fv = asString(p.focus_area)
      if (fv && fv.trim()) focusSet.add(fv)
    }
    const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b))
    return [sort(pillarSet), sort(focusSet)]
  }, [data])

  const filtered = useMemo(() => {
    const principles = data?.principles ?? []
    const q = query.trim().toLowerCase()
    return principles.filter((p) => {
      if (pillar && asString(p.pillar) !== pillar) return false
      if (focusArea && asString(p.focus_area) !== focusArea) return false
      if (!q) return true
      const title = asString(asObject(p.statement)?.title) ?? ""
      const id = asString(p.principle_id) ?? ""
      return title.toLowerCase().includes(q) || id.toLowerCase().includes(q)
    })
  }, [data, query, pillar, focusArea])

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
      filtered,
    }),
    [data, error, query, pillar, pillars, focusArea, focusAreas, filtered],
  )

  return <PrinciplesContext.Provider value={value}>{children}</PrinciplesContext.Provider>
}

export function usePrinciples() {
  const ctx = useContext(PrinciplesContext)
  if (!ctx) throw new Error("usePrinciples must be used within a PrinciplesProvider")
  return ctx
}
