"use client";

import { Search, Users, Sparkles, Snowflake, BarChart3, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type Filter = "all" | "enriched" | "cold";
export type Seniority = "Senior" | "Mid" | "Entry";
export type Stats = { total: number; enriched: number; cold: number };

const FILTERS: { key: Filter; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All leads", icon: <Users className="h-4 w-4" /> },
  { key: "enriched", label: "Enriched", icon: <Sparkles className="h-4 w-4" /> },
  { key: "cold", label: "Cold", icon: <Snowflake className="h-4 w-4" /> },
];

const SENIORITY: Seniority[] = ["Senior", "Mid", "Entry"];

export function Sidebar({
  q,
  setQ,
  filter,
  setFilter,
  seg,
  setSeg,
  stats,
}: {
  q: string;
  setQ: (v: string) => void;
  filter: Filter;
  setFilter: (f: Filter) => void;
  seg: Seniority | null;
  setSeg: (s: Seniority | null) => void;
  stats: Stats | null;
}) {
  const counts: Record<Filter, number | undefined> = {
    all: stats?.total,
    enriched: stats?.enriched,
    cold: stats?.cold,
  };

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-72 shrink-0 overflow-y-auto border-r bg-card/40 p-5 md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, domain…"
          className="pl-9"
        />
      </div>

      <div className="mt-6">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Segment
        </p>
        <nav className="space-y-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {f.icon}
                {f.label}
              </span>
              {counts[f.key] !== undefined && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
                    filter === f.key ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[f.key]!.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Seniority
        </p>
        <div className="relative">
          <BarChart3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={seg ?? ""}
            onChange={(e) => setSeg((e.target.value || null) as Seniority | null)}
            className="h-10 w-full appearance-none rounded-lg border bg-card px-9 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All seniority</option>
            {SENIORITY.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="mt-6 rounded-xl border bg-card p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </p>
          <div className="space-y-3 text-sm">
            <Stat icon={<Users className="h-4 w-4" />} label="Total" value={stats.total} />
            <Stat
              icon={<Sparkles className="h-4 w-4 text-emerald-500" />}
              label="Enriched"
              value={stats.enriched}
              sub={stats.total ? `${Math.round((stats.enriched / stats.total) * 100)}%` : undefined}
            />
            <Stat icon={<Snowflake className="h-4 w-4" />} label="Cold" value={stats.cold} />
          </div>
        </div>
      )}
    </aside>
  );
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-semibold tabular-nums">
        {value.toLocaleString()}
        {sub && <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}
