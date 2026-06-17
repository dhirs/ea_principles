"use client";

import { useEffect, useState } from "react";
import {
  X,
  ExternalLink,
  Briefcase,
  Building2,
  Loader2,
  MapPin,
  Globe,
  Users,
  Phone,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Detail = {
  email: string;
  fname: string | null;
  lname: string | null;
  domain: string | null;
  seg: string | null; // generated: coalesce(seg_override, title-inferred)
  seg_override: string | null; // manual override; null = Auto
  data: Record<string, unknown> & { apollo?: ApolloRec | null };
  updated_at: string;
};

const SENIORITY_OPTIONS = ["Senior", "Mid", "Entry", "Unknown"] as const;

type Organization = {
  name?: string;
  website_url?: string | null;
  primary_domain?: string | null;
  linkedin_url?: string | null;
  industry?: string | null;
  estimated_num_employees?: number | null;
  founded_year?: number | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  raw_address?: string | null;
};

type ApolloRec = {
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  headline?: string;
  linkedin_url?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  organization?: Organization | null;
  employment_history?: {
    title?: string;
    organization_name?: string;
    start_date?: string | null;
    end_date?: string | null;
    current?: boolean;
  }[];
};

export function LeadDetail({
  email,
  onClose,
  onUpdated,
}: {
  email: string;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  // Local seniority state so edits reflect instantly without refetching.
  const [segOverride, setSegOverride] = useState<string | null>(null);
  const [effectiveSeg, setEffectiveSeg] = useState<string | null>(null);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leads/detail?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setDetail(null);
        } else {
          setDetail(d);
          setSegOverride(d.seg_override ?? null);
          setEffectiveSeg(d.seg ?? null);
          setSave("idle");
        }
      })
      .finally(() => setLoading(false));
  }, [email]);

  async function changeSeniority(value: string | null) {
    const prevOverride = segOverride;
    const prevSeg = effectiveSeg;
    setSegOverride(value); // optimistic
    setSave("saving");
    try {
      const res = await fetch("/api/leads/seg", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, seg_override: value }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const row = await res.json();
      setSegOverride(row.seg_override ?? null);
      setEffectiveSeg(row.seg ?? null); // recomputed generated value
      setSave("saved");
      onUpdated?.(); // refresh the list row
      setTimeout(() => setSave((s) => (s === "saved" ? "idle" : s)), 1500);
    } catch {
      setSegOverride(prevOverride); // revert optimistic change
      setEffectiveSeg(prevSeg);
      setSave("error");
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const apollo = detail?.data?.apollo ?? null;
  const org = apollo?.organization ?? null;
  // Prefer the Apollo node's values when enriched.
  const fname = apollo?.first_name || detail?.fname;
  const lname = apollo?.last_name || detail?.lname;
  const company = org?.name || (detail?.data?.company as string | undefined) || "";
  const fullName = [fname, lname].filter(Boolean).join(" ") || apollo?.name || email;

  // Company website: prefer the org's website, then its primary domain, then the
  // lead's email domain. Always a normalised absolute URL.
  const toUrl = (v?: string | null) =>
    v ? (v.startsWith("http") ? v : `https://${v}`) : null;
  const companyUrl =
    toUrl(org?.website_url) || toUrl(org?.primary_domain) || toUrl(detail?.domain);
  const personLocation = [apollo?.city, apollo?.state, apollo?.country]
    .filter(Boolean)
    .join(", ");
  const orgLocation = [org?.city, org?.state, org?.country].filter(Boolean).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl overflow-y-auto border-l bg-card shadow-2xl animate-in slide-in-from-right">
        <div className="sticky top-0 flex items-center justify-between border-b bg-card/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold tracking-tight">Lead detail</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !detail ? (
          <div className="p-6 text-sm text-muted-foreground">Not found.</div>
        ) : (
          <div className="space-y-6 p-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">{fullName}</h3>
                {apollo ? (
                  <Badge variant="success">Enriched</Badge>
                ) : (
                  <Badge variant="secondary">Cold</Badge>
                )}
              </div>
              <a
                href={`mailto:${detail.email}`}
                className="text-sm text-muted-foreground hover:underline"
              >
                {detail.email}
              </a>
            </div>

            {/* Seniority: writes seg_override (Auto = null reverts to seg's auto value) */}
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="seniority"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Seniority
                </label>
                <span className="text-xs text-muted-foreground">
                  {save === "saving" && "Saving…"}
                  {save === "saved" && "Saved ✓"}
                  {save === "error" && <span className="text-destructive">Failed — retry</span>}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <select
                  id="seniority"
                  value={segOverride ?? ""}
                  disabled={save === "saving"}
                  onChange={(e) => changeSeniority(e.target.value || null)}
                  className="h-10 flex-1 rounded-lg border bg-card px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Auto</option>
                  {SENIORITY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {effectiveSeg && (
                  <Badge variant={segOverride ? "default" : "secondary"}>
                    {effectiveSeg}
                    {!segOverride && (
                      <span className="ml-1 font-normal opacity-70">(auto)</span>
                    )}
                  </Badge>
                )}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Domain</dt>
                <dd>
                  {companyUrl ? (
                    <a
                      href={companyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      {detail.domain || "—"}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    detail.domain || "—"
                  )}
                </dd>
              </div>
              <Field label="Company" value={company || "—"} />
              {apollo?.title && <Field label="Title" value={apollo.title} icon={<Briefcase className="h-3.5 w-3.5" />} />}
              {personLocation && (
                <Field label="Location" value={personLocation} icon={<MapPin className="h-3.5 w-3.5" />} />
              )}
              {apollo?.linkedin_url && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">LinkedIn</dt>
                  <dd>
                    <a
                      href={apollo.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> LinkedIn
                    </a>
                  </dd>
                </div>
              )}
            </dl>

            {org && (
              <div className="rounded-xl border bg-muted/30 p-4">
                <h4 className="mb-3 flex items-center gap-1.5 text-sm font-semibold">
                  <Building2 className="h-4 w-4" /> {org.name || "Organization"}
                </h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {org.industry && (
                    <Field label="Industry" value={cap(org.industry)} icon={<Briefcase className="h-3.5 w-3.5" />} />
                  )}
                  {typeof org.estimated_num_employees === "number" && (
                    <Field
                      label="Employees"
                      value={org.estimated_num_employees.toLocaleString()}
                      icon={<Users className="h-3.5 w-3.5" />}
                    />
                  )}
                  {org.founded_year ? (
                    <Field label="Founded" value={String(org.founded_year)} icon={<Calendar className="h-3.5 w-3.5" />} />
                  ) : null}
                  {orgLocation && (
                    <Field label="HQ" value={orgLocation} icon={<MapPin className="h-3.5 w-3.5" />} />
                  )}
                  {org.phone && (
                    <Field label="Phone" value={org.phone} icon={<Phone className="h-3.5 w-3.5" />} />
                  )}
                  {companyUrl && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Website</dt>
                      <dd>
                        <a
                          href={companyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <Globe className="h-3.5 w-3.5" /> Visit site
                        </a>
                      </dd>
                    </div>
                  )}
                  {org.linkedin_url && (
                    <div>
                      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Company LinkedIn</dt>
                      <dd>
                        <a
                          href={org.linkedin_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Profile
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
                {org.raw_address && (
                  <p className="mt-3 text-xs text-muted-foreground">{cap(org.raw_address)}</p>
                )}
              </div>
            )}

            {apollo?.headline && (
              <p className="rounded-lg border bg-muted/40 p-3 text-sm italic text-muted-foreground">
                {apollo.headline}
              </p>
            )}

            {apollo?.employment_history && apollo.employment_history.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Building2 className="h-4 w-4" /> Employment history
                </h4>
                <ol className="space-y-2 border-l pl-4">
                  {apollo.employment_history.slice(0, 8).map((job, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[1.30rem] top-1.5 h-2 w-2 rounded-full bg-border" />
                      <div className="text-sm font-medium">{job.title || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.organization_name}
                        {job.start_date && (
                          <span>
                            {" · "}
                            {job.start_date?.slice(0, 4)}–{job.current ? "present" : job.end_date?.slice(0, 4) || "?"}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                Raw JSON
              </summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                {JSON.stringify(detail.data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}

function cap(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-1.5">
        {icon}
        {value || "—"}
      </dd>
    </div>
  );
}
