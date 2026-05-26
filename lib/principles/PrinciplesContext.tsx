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
  filtered: Principle[]
}

const PrinciplesContext = createContext<PrinciplesContextValue | null>(null)

export function PrinciplesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PrinciplesPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    fetch("/api/data")
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return r.json()
      })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  const filtered = useMemo(() => {
    const principles = data?.principles ?? []
    const q = query.trim().toLowerCase()
    if (!q) return principles
    return principles.filter((p) => {
      const title = asString(asObject(p.statement)?.title) ?? ""
      const id = asString(p.principle_id) ?? ""
      return title.toLowerCase().includes(q) || id.toLowerCase().includes(q)
    })
  }, [data, query])

  const value = useMemo(
    () => ({ data, error, query, setQuery, filtered }),
    [data, error, query, filtered],
  )

  return <PrinciplesContext.Provider value={value}>{children}</PrinciplesContext.Provider>
}

export function usePrinciples() {
  const ctx = useContext(PrinciplesContext)
  if (!ctx) throw new Error("usePrinciples must be used within a PrinciplesProvider")
  return ctx
}
