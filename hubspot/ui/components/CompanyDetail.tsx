"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// A Stage-6 contact at this account. Sourced from lead_provenance, so every row is a
// person we actually hold an email for.
type Contact = {
  email: string;
  name: string;
  title: string | null;
  seniority: string | null;
  seg: string | null;
};

// One org<->technology row (the apollo_company_technology view); passed in from the page.
export type TechRow = { apollo_org_id: string; technology_uid: string; technology_name: string };

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

export function CompanyDetail({
  company: c,
  technologies = [],
  onClose,
}: {
  company: CompanyRow;
  technologies?: TechRow[];
  onClose: () => void;
}) {
  // Contacts are the one thing the page does not already hold, so this is the drawer's
  // only fetch. Keyed by apollo_org_id (domain is nullable).
  const [contacts, setContacts] = useState<Contact[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContacts(null);
    fetch(`/api/companies/contacts?apollo_org_id=${encodeURIComponent(c.apollo_org_id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setContacts(d.contacts ?? []);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      });
    return () => {
      cancelled = true;
    };
  }, [c.apollo_org_id]);

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

          {/* Contacts — the Stage 6 people at this account, most senior first. Each
              opens /?lead=<email> in a NEW TAB: the company list behind this drawer is
              a filtered, paginated search result, and navigating away would discard it.
              Only ~818 of 1,425 scored accounts have any, so the empty state is the
              common case and says why. */}
          <section className="rounded-xl border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacts {contacts && contacts.length > 0 && `(${contacts.length})`}
            </h4>
            {contacts === null ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contacts acquired for this account yet.
              </p>
            ) : (
              <ul className="space-y-1">
                {contacts.map((p) => (
                  <li key={p.email}>
                    <a
                      href={`/?lead=${encodeURIComponent(p.email)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-card"
                    >
                      <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium hover:underline">
                            {p.name}
                          </span>
                          {p.seg && (
                            <span className="shrink-0 rounded-full border bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {p.seg}
                            </span>
                          )}
                        </span>
                        {p.title && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {p.title}
                          </span>
                        )}
                        <span className="block truncate text-xs text-muted-foreground/70">
                          {p.email}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Technologies — only the Stage 4 CDP probe matches exist; Apollo returns
              no full technographics on this plan, so most companies show none. */}
          <section className="rounded-xl border bg-muted/30 p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Technologies {technologies.length > 0 && `(${technologies.length})`}
            </h4>
            {technologies.length === 0 ? (
              <p className="text-sm text-muted-foreground">No technologies detected.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {[...technologies]
                  .sort((a, b) => a.technology_name.localeCompare(b.technology_name))
                  .map((t) => (
                    <span
                      key={t.technology_uid}
                      className="rounded-full border bg-card px-2.5 py-1 text-xs font-medium"
                    >
                      {t.technology_name}
                    </span>
                  ))}
              </div>
            )}
          </section>

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
