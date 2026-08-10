"use client";

import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { NavPanel } from "@/components/NavPanel";
import { CompanyDetail, type CompanyRow } from "@/components/CompanyDetail";
import { Input } from "@/components/ui/input";

const PAGE_SIZES = [25, 50, 75, 100];

// Numeric columns that can be sorted.
type SortKey = "revenue" | "growth_12m";
type SortDir = "asc" | "desc";

// The 5 NAICS hierarchy levels, each surfaced as a dropdown filter (by title).
type NaicsKey =
  | "sector_title"
  | "subsector_title"
  | "industry_group_title"
  | "naics_industry_title"
  | "national_industry_title";

const NAICS_LEVELS: { key: NaicsKey; label: string }[] = [
  { key: "sector_title", label: "Sector" },
  { key: "subsector_title", label: "Subsector" },
  { key: "industry_group_title", label: "Industry Group" },
  { key: "naics_industry_title", label: "NAICS Industry" },
  { key: "national_industry_title", label: "National Industry" },
];

const EMPTY_FILTERS: Record<NaicsKey, string> = {
  sector_title: "",
  subsector_title: "",
  industry_group_title: "",
  naics_industry_title: "",
  national_industry_title: "",
};

function growthPct(v: number | null) {
  if (v === null || v === undefined) return null;
  // Apollo growth values are fractions (e.g. 0.12 = +12%).
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
}

// One org<->technology row from /api/technologies (the apollo_company_technology view).
type TechRow = { apollo_org_id: string; technology_uid: string; technology_name: string };
type TechOption = { uid: string; name: string; count: number };

// One org->country row from /api/companies/countries (the company_country view — a
// company's country derived from its leads, since Apollo has no company location).
type CountryRow = { apollo_org_id: string; country: string };
type CountryOption = { country: string; count: number };

// The custom taxonomy (/api/companies/categories). A curated business-model label per
// company, with its vocabulary scoped to a NAICS subsector — NAICS itself can't tell a
// buyout firm from a wealth manager (both are 523940). `vocabulary` is every identifier
// defined for a subsector; `rows` is the org->identifier assignment.
// See prospecting/adr/2026-08-10-company-custom-taxonomy.md
type CategoryRow = { apollo_org_id: string; subsector_code: string; slug: string; label: string };
type VocabRow = { subsector_code: string; slug: string; label: string; sort_order: number };
type CategoryOption = { slug: string; label: string; count: number };

export default function CompaniesPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <Companies />
    </Suspense>
  );
}

function Companies() {
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [naicsFilters, setNaicsFilters] = useState<Record<NaicsKey, string>>(EMPTY_FILTERS);
  const [revMin, setRevMin] = useState("");
  const [revMax, setRevMax] = useState("");
  const [techRows, setTechRows] = useState<TechRow[]>([]);
  const [techFilter, setTechFilter] = useState(""); // selected technology_uid, "" = all
  const [techOnly, setTechOnly] = useState(true); // only rows with >=1 technology (default on)
  const [countryRows, setCountryRows] = useState<CountryRow[]>([]);
  const [countryFilter, setCountryFilter] = useState(""); // selected country, "" = all
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);
  const [categoryVocab, setCategoryVocab] = useState<VocabRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState(""); // selected slug, "" = all
  const [selected, setSelected] = useState<CompanyRow | null>(null);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc"); // numbers default to biggest-first
    }
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load companies.");
      } else {
        setRows(data.rows ?? []);
      }
      setLoading(false);
    })();
  }, []);

  // Deep link: /companies?org=<apollo_org_id> opens that company's drawer once the
  // rows are in. This is what the lead drawer's "company record" link points at.
  // Searches the FULL row set, so it works regardless of the active filters — a
  // linked company opens even when the current filters would exclude it.
  useEffect(() => {
    const org = searchParams.get("org");
    if (!org || rows.length === 0) return;
    const match = rows.find((r) => r.apollo_org_id === org);
    if (match) setSelected(match);
  }, [searchParams, rows]);

  // The org<->technology mapping is small (~200 rows) and non-critical, so it loads
  // independently — a failure here just leaves the Apollo Technologies filter empty.
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/technologies");
      if (res.ok) setTechRows(((await res.json()).rows ?? []) as TechRow[]);
    })();
  }, []);

  // Company->country map (derived from leads), loaded independently like the tech
  // mapping. A failure just leaves the Country filter empty.
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/companies/countries");
      if (res.ok) setCountryRows(((await res.json()).rows ?? []) as CountryRow[]);
    })();
  }, []);

  // Custom-taxonomy vocabulary + assignments, loaded independently like the tech and
  // country maps. A failure just leaves the Custom Taxonomy filter empty.
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/companies/categories");
      if (!res.ok) return;
      const data = await res.json();
      setCategoryVocab((data.vocabulary ?? []) as VocabRow[]);
      setCategoryRows((data.rows ?? []) as CategoryRow[]);
    })();
  }, []);

  // org id -> custom-taxonomy slug. One label per company, so a plain Map.
  const categoryByOrg = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of categoryRows) m.set(c.apollo_org_id, c.slug);
    return m;
  }, [categoryRows]);

  // The subsector_code behind the selected Subsector title — the vocabulary is keyed
  // by code, the filter holds the title, so the rows are what bridges them.
  const activeSubsectorCode = useMemo(() => {
    const title = naicsFilters.subsector_title;
    if (!title) return null;
    return rows.find((r) => r.subsector_title === title)?.subsector_code ?? null;
  }, [rows, naicsFilters.subsector_title]);

  // org id -> country, for O(1) lookup in the filter and dropdown counts.
  const countryByOrg = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countryRows) m.set(c.apollo_org_id, c.country);
    return m;
  }, [countryRows]);

  // uid -> display name, so the dropdown can label a technology without re-scanning
  // techRows (the option counts are built from the company rows, not the pairs).
  const techNameByUid = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of techRows) if (!m.has(t.technology_uid)) m.set(t.technology_uid, t.technology_name);
    return m;
  }, [techRows]);

  // org id -> the distinct uids it runs. A Set so an org counts once per technology
  // even if the underlying signals array repeats one.
  const techUidsByOrg = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const t of techRows) {
      if (!m.has(t.apollo_org_id)) m.set(t.apollo_org_id, new Set());
      m.get(t.apollo_org_id)!.add(t.technology_uid);
    }
    return m;
  }, [techRows]);

  // uid -> set of org ids running it, for O(1) membership in the filter.
  const techOrgSets = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const t of techRows) {
      if (!m.has(t.technology_uid)) m.set(t.technology_uid, new Set());
      m.get(t.technology_uid)!.add(t.apollo_org_id);
    }
    return m;
  }, [techRows]);

  // org id -> the technologies we have evidence for (feeds the drawer). Only the
  // Stage 4 CDP probe matches exist, so most orgs map to nothing.
  const techByOrg = useMemo(() => {
    const m = new Map<string, TechRow[]>();
    for (const t of techRows) {
      if (!m.has(t.apollo_org_id)) m.set(t.apollo_org_id, []);
      m.get(t.apollo_org_id)!.push(t);
    }
    return m;
  }, [techRows]);

  // Text search (name / domain / parent / all NAICS titles).
  const searched = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) =>
      [r.company, r.domain, r.parent_company, ...NAICS_LEVELS.map((l) => r[l.key])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [rows, q]);

  // Revenue bounds are typed in $M; the column is in dollars. Blank = open-ended.
  const scoped = useMemo(() => {
    const min = revMin.trim() === "" ? null : Number(revMin) * 1e6;
    const max = revMax.trim() === "" ? null : Number(revMax) * 1e6;
    if (min === null && max === null) return searched;
    return searched.filter((r) => {
      if (r.revenue === null || r.revenue === undefined) return false; // unknown revenue can't match a bound
      if (min !== null && !Number.isNaN(min) && r.revenue < min) return false;
      if (max !== null && !Number.isNaN(max) && r.revenue > max) return false;
      return true;
    });
  }, [searched, revMin, revMax]);

  const matchesFilters = (r: CompanyRow, filters: Record<NaicsKey, string>) =>
    NAICS_LEVELS.every((l) => !filters[l.key] || r[l.key] === filters[l.key]);

  // The one filter predicate every facet and the table share. `skip` drops a single
  // dimension so a dropdown can count "what would I get if I picked this, given
  // everything else that's selected" without its own selection collapsing the list.
  // Pass `naics` to override the level filters (the NAICS facets clear their own level).
  //
  // Facets used to be built from `scoped` (search + revenue only), so their counts
  // never moved when you picked a sector — Country and Apollo Technologies now honour
  // the other dimensions like the NAICS levels always have.
  type Facet = "naics" | "tech" | "country" | "category" | null;
  const passes = (
    r: CompanyRow,
    skip: Facet,
    naics: Record<NaicsKey, string> = naicsFilters,
  ) => {
    if (skip !== "naics" && !matchesFilters(r, naics)) return false;
    if (skip !== "tech") {
      const techSet = techFilter ? techOrgSets.get(techFilter) : null;
      if (techSet && !techSet.has(r.apollo_org_id)) return false;
      if (techOnly && !techByOrg.has(r.apollo_org_id)) return false;
    }
    if (skip !== "country" && countryFilter && countryByOrg.get(r.apollo_org_id) !== countryFilter)
      return false;
    if (skip !== "category" && categoryFilter && categoryByOrg.get(r.apollo_org_id) !== categoryFilter)
      return false;
    return true;
  };

  const filtered = useMemo(
    () => scoped.filter((r) => passes(r, null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoped, naicsFilters, techFilter, techOnly, techOrgSets, techByOrg, countryFilter, countryByOrg, categoryFilter, categoryByOrg],
  );

  // Custom-taxonomy options: the FULL vocabulary for the selected subsector — every
  // possible identifier, not just the ones with matches — each carrying a count of the
  // companies that would survive the other active filters. Empty until a subsector is
  // picked, because the vocabulary is subsector-scoped.
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    if (!activeSubsectorCode) return [];
    const counts = new Map<string, number>();
    for (const r of scoped) {
      if (!passes(r, "category")) continue;
      const slug = categoryByOrg.get(r.apollo_org_id);
      if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
    return categoryVocab
      .filter((v) => v.subsector_code === activeSubsectorCode)
      .map((v) => ({ slug: v.slug, label: v.label, count: counts.get(v.slug) ?? 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, activeSubsectorCode, categoryVocab, categoryByOrg, naicsFilters, techFilter, techOnly, techOrgSets, techByOrg, countryFilter, countryByOrg]);

  // Country options: every other active filter applied, its own dimension skipped.
  // Every company carries a country now — those no lead can speak for come back as
  // `UNK` from the view rather than being absent — so these counts DO sum to the
  // visible row total. Pick `UNK` to work through the ones still needing a country.
  const countryOptions = useMemo<CountryOption[]>(() => {
    const counts = new Map<string, number>();
    for (const r of scoped) {
      if (!passes(r, "country")) continue;
      const c = countryByOrg.get(r.apollo_org_id);
      if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    // Keep the active selection listed even at zero, or the <select> would render
    // blank while still filtering.
    if (countryFilter && !counts.has(countryFilter)) counts.set(countryFilter, 0);
    return [...counts.entries()]
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, countryByOrg, countryFilter, naicsFilters, techFilter, techOnly, techOrgSets, techByOrg, categoryFilter, categoryByOrg]);

  // Technology options: counts are COMPANIES, not org<->technology pairs. Counting
  // pairs (the old behaviour) double-counted any company running more than one tool,
  // so the numbers could never be reconciled against the table.
  const techOptions = useMemo<TechOption[]>(() => {
    const counts = new Map<string, number>();
    for (const r of scoped) {
      if (!passes(r, "tech")) continue;
      for (const uid of techUidsByOrg.get(r.apollo_org_id) ?? []) {
        counts.set(uid, (counts.get(uid) ?? 0) + 1);
      }
    }
    if (techFilter && !counts.has(techFilter)) counts.set(techFilter, 0);
    return [...counts.entries()]
      .map(([uid, count]) => ({ uid, name: techNameByUid.get(uid) ?? uid, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, techUidsByOrg, techNameByUid, techFilter, naicsFilters, countryFilter, countryByOrg, categoryFilter, categoryByOrg]);

  // NAICS options: each level's choices reflect the search + revenue range + the OTHER
  // active level filters (the cascade) + the technology and country filters, and now
  // carry a company count like the other two facets.
  const naicsOptions = useMemo(() => {
    const out = {} as Record<NaicsKey, { value: string; count: number }[]>;
    for (const { key } of NAICS_LEVELS) {
      const others = { ...naicsFilters, [key]: "" };
      const counts = new Map<string, number>();
      for (const r of scoped) {
        const v = r[key] as string | null;
        if (!v || !passes(r, null, others)) continue;
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
      const active = naicsFilters[key];
      if (active && !counts.has(active)) counts.set(active, 0);
      out[key] = [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, naicsFilters, techFilter, techOnly, techOrgSets, techByOrg, countryFilter, countryByOrg, categoryFilter, categoryByOrg]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Nulls always sink to the bottom, regardless of direction.
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return (av - bv) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  // Changing a level filter clears the deeper levels (their valid options
  // depend on the higher one), then jumps back to the first page.
  function setNaics(key: NaicsKey, value: string) {
    const idx = NAICS_LEVELS.findIndex((l) => l.key === key);
    setNaicsFilters((prev) => {
      const next = { ...prev, [key]: value };
      for (let i = idx + 1; i < NAICS_LEVELS.length; i++) next[NAICS_LEVELS[i].key] = "";
      return next;
    });
    // The custom taxonomy hangs off the subsector, so changing Sector or Subsector
    // invalidates the picked identifier — clear it like a deeper NAICS level.
    if (idx <= NAICS_LEVELS.findIndex((l) => l.key === "subsector_title")) setCategoryFilter("");
  }
  const anyFilter =
    Object.values(naicsFilters).some(Boolean) ||
    !!revMin ||
    !!revMax ||
    !!techFilter ||
    techOnly ||
    !!countryFilter ||
    !!categoryFilter;

  function clearFilters() {
    setNaicsFilters(EMPTY_FILTERS);
    setRevMin("");
    setRevMax("");
    setTechFilter("");
    setTechOnly(false);
    setCountryFilter("");
    setCategoryFilter("");
  }

  // Reset to the first page whenever the result set, sort, or page size changes.
  useEffect(() => {
    setPage(1);
  }, [q, pageSize, sortKey, sortDir, naicsFilters, revMin, revMax, techFilter, techOnly, countryFilter, categoryFilter]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const start = (clampedPage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);
  const showPager = !loading && sorted.length > 0;

  return (
    <div className="flex">
      <NavPanel />

      <main className="min-w-0 flex-1 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : `${filtered.length}${filtered.length !== rows.length ? ` of ${rows.length}` : ""} target compan${
                    filtered.length === 1 ? "y" : "ies"
                  }`}
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, domain, NAICS…"
              className="pl-9"
            />
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {!loading && (
          <div className="mb-4 rounded-xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Filters
              </span>
              {anyFilter && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear all
                </button>
              )}
            </div>

            <div className="mb-3 flex flex-wrap items-end gap-6 border-b pb-3">
              <div>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Revenue ($M)
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={revMin}
                    onChange={(e) => setRevMin(e.target.value)}
                    placeholder="Min"
                    className="h-9 w-28"
                    aria-label="Minimum revenue in millions"
                  />
                  <span className="text-sm text-muted-foreground">to</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={revMax}
                    onChange={(e) => setRevMax(e.target.value)}
                    placeholder="Max"
                    className="h-9 w-28"
                    aria-label="Maximum revenue in millions"
                  />
                </div>
              </div>
              <div>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Country
                </span>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="h-9 w-56 rounded-lg border bg-card px-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Filter by country"
                >
                  <option value="">All countries</option>
                  {countryOptions.map((c) => (
                    <option key={c.country} value={c.country}>
                      {c.country} ({c.count.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3 border-b pb-3">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">
                Apollo Technologies
              </span>
              <TechCombobox options={techOptions} value={techFilter} onChange={setTechFilter} />
              <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={techOnly}
                  onChange={(e) => setTechOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Only companies with a known technology
              </label>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {NAICS_LEVELS.map(({ key, label }) => (
                <Fragment key={key}>
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">
                      {label}
                    </span>
                    <select
                      value={naicsFilters[key]}
                      onChange={(e) => setNaics(key, e.target.value)}
                      className="w-full rounded-lg border bg-card px-2 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">All</option>
                      {naicsOptions[key].map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.value} ({o.count.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Sits immediately after Subsector: the vocabulary is subsector-scoped,
                      so this is the level it hangs off. Disabled until one is picked. */}
                  {key === "subsector_title" && (
                    <label className="block">
                      <span className="mb-1 block text-xs font-medium text-muted-foreground">
                        Custom Taxonomy
                      </span>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        disabled={categoryOptions.length === 0}
                        className="w-full rounded-lg border bg-card px-2 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">
                          {!naicsFilters.subsector_title
                            ? "Select a subsector first"
                            : categoryOptions.length === 0
                              ? "None defined for this subsector"
                              : "All"}
                        </option>
                        {categoryOptions.map((o) => (
                          <option key={o.slug} value={o.slug}>
                            {o.label} ({o.count.toLocaleString()})
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        {showPager && (
          <Pager
            className="mb-3"
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={clampedPage}
            pageCount={pageCount}
            start={start}
            total={sorted.length}
            setPage={setPage}
          />
        )}

        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Sector</th>
                <th className="px-4 py-3 font-medium">Subsector</th>
                <th className="px-4 py-3 font-medium">Technologies</th>
                <SortHeader label="12m" col="growth_12m" active={sortKey} dir={sortDir} onClick={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    {rows.length === 0 ? "No companies in the universe yet." : "No matches."}
                  </td>
                </tr>
              ) : (
                paged.map((c) => (
                  <tr key={c.apollo_org_id} className="border-b last:border-0 align-top">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(c)}
                        className="text-left font-medium hover:text-primary hover:underline"
                      >
                        {c.company}
                      </button>
                      {c.domain && (
                        <div className="text-xs text-muted-foreground">{c.domain}</div>
                      )}
                      {c.parent_company && (
                        <div className="text-xs text-muted-foreground">
                          Parent: {c.parent_company}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.sector_title || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {c.subsector_title || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {techByOrg
                        .get(c.apollo_org_id)
                        ?.map((t) => t.technology_name)
                        .sort((a, b) => a.localeCompare(b))
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {growthPct(c.growth_12m) ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showPager && (
          <Pager
            className="mt-4"
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={clampedPage}
            pageCount={pageCount}
            start={start}
            total={sorted.length}
            setPage={setPage}
          />
        )}
      </main>

      {selected && (
        <CompanyDetail
          company={selected}
          technologies={techByOrg.get(selected.apollo_org_id) ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Pager({
  className,
  pageSize,
  setPageSize,
  page,
  pageCount,
  start,
  total,
  setPage,
}: {
  className?: string;
  pageSize: number;
  setPageSize: (n: number) => void;
  page: number;
  pageCount: number;
  start: number;
  total: number;
  setPage: (fn: (p: number) => number) => void;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-sm ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="rounded-lg border bg-card px-2 py-1 text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <span className="tabular-nums text-muted-foreground">
          {start + 1}–{Math.min(start + pageSize, total)} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card shadow-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-1 tabular-nums text-muted-foreground">
            {page} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className="flex h-8 w-8 items-center justify-center rounded-lg border bg-card shadow-sm transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Searchable single-select for the Apollo Technologies filter. Type to narrow the
// list; the options are only the technologies we actually have company data for
// (the apollo_company_technology view), so this list is short by design.
function TechCombobox({
  options,
  value,
  onChange,
}: {
  options: TechOption[];
  value: string;
  onChange: (uid: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.uid === value) ?? null;

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const term = query.trim().toLowerCase();
  const matches = term ? options.filter((o) => o.name.toLowerCase().includes(term)) : options;

  function pick(uid: string) {
    onChange(uid);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={open ? query : selected?.name ?? ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={selected ? selected.name : "Search a technology…"}
          className="h-9 w-full rounded-lg border bg-card pl-9 pr-8 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => pick("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear technology filter"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border bg-card py-1 shadow-lg">
          {matches.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No technology matches.</li>
          ) : (
            matches.map((o) => (
              <li key={o.uid}>
                <button
                  type="button"
                  onClick={() => pick(o.uid)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent ${
                    o.uid === value ? "font-medium text-primary" : ""
                  }`}
                >
                  <span className="truncate">{o.name}</span>
                  <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                    {o.count}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function SortHeader({
  label,
  col,
  active,
  dir,
  onClick,
}: {
  label: string;
  col: SortKey;
  active: SortKey | null;
  dir: SortDir;
  onClick: (col: SortKey) => void;
}) {
  const isActive = active === col;
  const Icon = !isActive ? ChevronsUpDown : dir === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className="px-4 py-3 font-medium text-right">
      <button
        onClick={() => onClick(col)}
        className={`ml-auto flex items-center gap-1 hover:text-foreground ${
          isActive ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${isActive ? "" : "opacity-50"}`} />
      </button>
    </th>
  );
}
