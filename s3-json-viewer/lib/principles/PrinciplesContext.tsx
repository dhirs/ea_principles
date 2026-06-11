"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { asArray, asObject, asString, type Principle, type PrinciplesPayload } from "./types"

function getAwsBestPractices(p: Principle): string[] {
  const refs = asArray(asObject(asObject(p.framework_mappings)?.aws)?.references) ?? []
  return refs
    .map((r) => asString(asObject(r)?.best_practice))
    .filter((s): s is string => !!s && !!s.trim())
}

// NIST AI RMF category/subcategory pairs for a standard (from /api/index).
function getNistMappings(p: Principle): Array<{ category: string; subcategory: string }> {
  const refs = asArray(asObject(asObject(p.framework_mappings)?.nist)?.references) ?? []
  return refs.map((r) => {
    const o = asObject(r)
    return {
      category: asString(o?.category) ?? "",
      subcategory: asString(o?.subcategory) ?? "",
    }
  })
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
  nistCategory: string
  setNistCategory: (c: string) => void
  nistCategories: string[]
  nistSubcategory: string
  setNistSubcategory: (s: string) => void
  nistSubcategories: string[]
  filtered: Principle[]
}

const PrinciplesContext = createContext<PrinciplesContextValue | null>(null)

export function PrinciplesProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [data, setData] = useState<PrinciplesPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pillar, setPillarState] = useState("")
  const [focusArea, setFocusAreaState] = useState("")
  const [bestPractice, setBestPracticeState] = useState("")
  const [maturityLevel, setMaturityLevelState] = useState("")
  const [nistCategory, setNistCategoryState] = useState("")
  const [nistSubcategory, setNistSubcategoryState] = useState("")

  // Selecting a filter only affects the list view; if we're elsewhere (a detail
  // page or the landing dashboard), jump to /standards so the result is visible.
  // Pushing while already on /standards is a no-op, so no pathname check needed.
  const goToList = useCallback(() => {
    router.push("/standards")
  }, [router])

  const setPillar = useCallback((v: string) => { setPillarState(v); goToList() }, [goToList])
  const setFocusArea = useCallback((v: string) => { setFocusAreaState(v); goToList() }, [goToList])
  const setBestPractice = useCallback((v: string) => { setBestPracticeState(v); goToList() }, [goToList])
  const setMaturityLevel = useCallback((v: string) => { setMaturityLevelState(v); goToList() }, [goToList])
  const setNistCategory = useCallback((v: string) => { setNistCategoryState(v); goToList() }, [goToList])
  const setNistSubcategory = useCallback((v: string) => { setNistSubcategoryState(v); goToList() }, [goToList])

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

  const [pillars, focusAreas, bestPractices, maturityLevels, nistCategories, nistSubcategories] = useMemo(() => {
    const principles = data?.principles ?? []
    const pillarSet = new Set<string>()
    const focusSet = new Set<string>()
    const bpSet = new Set<string>()
    const maturitySet = new Set<string>()
    const nistCatSet = new Set<string>()
    const nistSubSet = new Set<string>()
    for (const p of principles) {
      const pv = asString(p.pillar)
      if (pv && pv.trim()) pillarSet.add(pv)
      // Scope focus areas to the selected pillar so the dropdown only offers
      // focus areas that exist within it.
      const fv = asString(p.focus_area)
      if (!pillar || pv === pillar) {
        if (fv && fv.trim()) focusSet.add(fv)
      }
      // Scope best practices to the selected pillar AND focus area so the
      // dropdown only offers practices that exist within the current selection.
      if ((!pillar || pv === pillar) && (!focusArea || fv === focusArea)) {
        for (const bp of getAwsBestPractices(p)) bpSet.add(bp)
      }
      const mv = asString(p.maturity_level)
      if (mv && mv.trim()) maturitySet.add(mv)
      // NIST categories list all of them; subcategories are scoped to the
      // selected category so the second dropdown only offers what's reachable.
      for (const m of getNistMappings(p)) {
        if (m.category) nistCatSet.add(m.category)
        if (m.subcategory && (!nistCategory || m.category === nistCategory)) {
          nistSubSet.add(m.subcategory)
        }
      }
    }
    const sort = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b))
    return [sort(pillarSet), sort(focusSet), sort(bpSet), sort(maturitySet), sort(nistCatSet), sort(nistSubSet)]
  }, [data, pillar, focusArea, nistCategory])

  // If the active focus area isn't part of the selected pillar, drop it.
  useEffect(() => {
    if (focusArea && !focusAreas.includes(focusArea)) setFocusAreaState("")
  }, [focusArea, focusAreas])

  // If the active best practice isn't part of the current pillar/focus area, drop it.
  useEffect(() => {
    if (bestPractice && !bestPractices.includes(bestPractice)) setBestPracticeState("")
  }, [bestPractice, bestPractices])

  // If the active NIST subcategory isn't under the selected category, drop it.
  useEffect(() => {
    if (nistSubcategory && !nistSubcategories.includes(nistSubcategory)) setNistSubcategoryState("")
  }, [nistSubcategory, nistSubcategories])

  const filtered = useMemo(() => {
    const principles = data?.principles ?? []
    const q = query.trim().toLowerCase()
    return principles.filter((p) => {
      if (pillar && asString(p.pillar) !== pillar) return false
      if (focusArea && asString(p.focus_area) !== focusArea) return false
      if (bestPractice && !getAwsBestPractices(p).includes(bestPractice)) return false
      if (maturityLevel && asString(p.maturity_level) !== maturityLevel) return false
      if (nistCategory || nistSubcategory) {
        const maps = getNistMappings(p)
        if (nistCategory && !maps.some((m) => m.category === nistCategory)) return false
        if (nistSubcategory && !maps.some((m) => m.subcategory === nistSubcategory)) return false
      }
      if (!q) return true
      const title = asString(asObject(p.statement)?.title) ?? ""
      const id = asString(p.standard_id) ?? ""
      return title.toLowerCase().includes(q) || id.toLowerCase().includes(q)
    })
  }, [data, query, pillar, focusArea, bestPractice, maturityLevel, nistCategory, nistSubcategory])

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
      nistCategory,
      setNistCategory,
      nistCategories,
      nistSubcategory,
      setNistSubcategory,
      nistSubcategories,
      filtered,
    }),
    [data, error, query, pillar, pillars, focusArea, focusAreas, bestPractice, bestPractices, maturityLevel, maturityLevels, nistCategory, nistCategories, nistSubcategory, nistSubcategories, filtered],
  )

  return <PrinciplesContext.Provider value={value}>{children}</PrinciplesContext.Provider>
}

export function usePrinciples() {
  const ctx = useContext(PrinciplesContext)
  if (!ctx) throw new Error("usePrinciples must be used within a PrinciplesProvider")
  return ctx
}
