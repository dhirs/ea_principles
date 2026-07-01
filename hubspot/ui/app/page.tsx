"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, SlidersHorizontal } from "lucide-react";
import { NavPanel } from "@/components/NavPanel";
import { LeadsFilters, type Filter, type Seniority, type Stats } from "@/components/LeadsFilters";
import { LeadDetail } from "@/components/LeadDetail";
import { Button } from "@/components/ui/button";

type Row = {
  email: string;
  fname: string | null;
  lname: string | null;
  domain: string | null;
  company: string | null;
  title: string | null;
  apollo_id: string | null;
  a_fname: string | null;
  a_lname: string | null;
  a_company: string | null;
};

export default function Page() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [seg, setSeg] = useState<Seniority | null>(null);
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // reset to first page when query/filter changes
  useEffect(() => setPage(0), [debouncedQ, filter, seg]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ q: debouncedQ, filter, page: String(page) });
    if (seg) params.set("seg", seg);
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setPageSize(data.pageSize ?? 50);
    setLoading(false);
  }, [debouncedQ, filter, seg, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => !d.error && setStats(d));
  }, []);

  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);
  const lastPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  return (
    <div className="flex">
      <NavPanel onActiveClick={() => setShowFilters((v) => !v)} />

      {showFilters && (
        <LeadsFilters
          q={q}
          setQ={setQ}
          filter={filter}
          setFilter={setFilter}
          seg={seg}
          setSeg={setSeg}
          stats={stats}
          onClose={() => setShowFilters(false)}
        />
      )}

      <main className="min-w-0 flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${total.toLocaleString()} ${filter === "all" ? "" : filter + " "}leads`}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" /> {showFilters ? "Hide filters" : "Filters"}
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[22%]" />
              <col className="w-[24%]" />
            </colgroup>
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">First name</th>
                <th className="px-4 py-3 font-medium">Last name</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Title</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                    No leads match.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  // Prefer the Apollo node's values when the lead is enriched.
                  const fname = r.a_fname || r.fname;
                  const lname = r.a_lname || r.lname;
                  const company = r.a_company || r.company;
                  return (
                    <tr
                      key={r.email}
                      onClick={() => setSelected(r.email)}
                      className="cursor-pointer border-b last:border-0 transition-colors hover:bg-accent/50"
                    >
                      <td className="break-words px-4 py-3 text-muted-foreground">{r.email}</td>
                      <td className="break-words px-4 py-3 font-medium">{fname || "—"}</td>
                      <td className="break-words px-4 py-3 font-medium">{lname || "—"}</td>
                      <td className="break-words px-4 py-3 text-muted-foreground">
                        {company || "—"}
                      </td>
                      <td className="break-words px-4 py-3 text-muted-foreground">
                        {r.title || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {from.toLocaleString()}–{to.toLocaleString()} of {total.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              {page + 1} / {lastPage + 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= lastPage || loading}
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </main>

      {selected && (
        <LeadDetail
          email={selected}
          onClose={() => setSelected(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
