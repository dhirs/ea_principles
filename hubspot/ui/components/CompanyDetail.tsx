"use client";

import { useEffect } from "react";
import { ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// The row shape the companies table already holds — the drawer needs no fetch.
export type CompanyRow = {
  apollo_org_id: string;
  company: string;
  domain: string | null;
  linkedin_url: string | null;
  employee_range: string | null;
  revenue: number | null;
  revenue_printed: string | null;
  parent_company: string | null;
  growth_6m: number | null;
  growth_12m: number | null;
  growth_24m: number | null;
  added_at: string;
  sector_title: string | null;
  subsector_title: string | null;
  industry_group_title: string | null;
  naics_industry_title: string | null;
  national_industry_title: string | null;
};

// NAICS, broadest level first — the same hierarchy the page filters on.
const NAICS_ROWS: { key: keyof CompanyRow; label: string }[] = [
  { key: "sector_title", label: "Sector" },
  { key: "subsector_title", label: "Subsector" },
  { key: "industry_group_title", label: "Industry Group" },
  { key: "naics_industry_title", label: "NAICS Industry" },
  { key: "national_industry_title", label: "National Industry" },
];

function growthPct(v: number | null) {
  if (v === null || v === undefined) return null;
  // Apollo growth values are fractions (e.g. 0.12 = +12%).
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(1)}%`;
}

function growthTone(v: number | null) {
  if (v === null || v === undefined) return "text-muted-foreground";
  if (v > 0) return "text-emerald-600 dark:text-emerald-400";
  if (v < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

export function CompanyDetail({ company: c, onClose }: { company: CompanyRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-card shadow-2xl animate-in slide-in-from-right">
        <div className="sticky top-0 flex items-center justify-between border-b bg-card/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold tracking-tight">Company detail</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <h3 className="text-xl font-semibold">{c.company}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              {c.domain && (
                <a
                  href={`https://${c.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {c.domain}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {c.linkedin_url && (
                <a
                  href={c.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  LinkedIn
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {c.parent_company && (
              <p className="mt-2 text-xs text-muted-foreground">Parent: {c.parent_company}</p>
            )}
          </div>

          {/* NAICS classification — broadest to narrowest. */}
          <section className="rounded-xl border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Classification (NAICS)
            </h4>
            <dl className="space-y-2">
              {NAICS_ROWS.map(({ key, label }) => (
                <div key={key} className="flex gap-3 text-sm">
                  <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 flex-1">{(c[key] as string | null) || "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Size &amp; growth
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-40 shrink-0 text-muted-foreground">Revenue</dt>
                <dd className="tabular-nums">{c.revenue_printed || "—"}</dd>
              </div>
              {[
                { label: "Headcount growth 6m", v: c.growth_6m },
                { label: "Headcount growth 12m", v: c.growth_12m },
                { label: "Headcount growth 24m", v: c.growth_24m },
              ].map(({ label, v }) => (
                <div key={label} className="flex gap-3">
                  <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className={`tabular-nums ${growthTone(v)}`}>{growthPct(v) ?? "—"}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Record
            </h4>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-40 shrink-0 text-muted-foreground">Added</dt>
                <dd>{new Date(c.added_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex gap-3">
                <dt className="w-40 shrink-0 text-muted-foreground">Apollo org id</dt>
                <dd className="break-all font-mono text-xs">{c.apollo_org_id}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
