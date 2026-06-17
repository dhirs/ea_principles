"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Briefcase, Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type Detail = {
  email: string;
  fname: string | null;
  lname: string | null;
  domain: string | null;
  data: Record<string, unknown> & { apollo?: ApolloRec | null };
  updated_at: string;
};

type ApolloRec = {
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  headline?: string;
  linkedin_url?: string | null;
  organization?: { name?: string } | null;
  employment_history?: {
    title?: string;
    organization_name?: string;
    start_date?: string | null;
    end_date?: string | null;
    current?: boolean;
  }[];
};

export function LeadDetail({ email, onClose }: { email: string; onClose: () => void }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leads/detail?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setDetail(d.error ? null : d))
      .finally(() => setLoading(false));
  }, [email]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const apollo = detail?.data?.apollo ?? null;
  // Prefer the Apollo node's values when enriched.
  const fname = apollo?.first_name || detail?.fname;
  const lname = apollo?.last_name || detail?.lname;
  const company =
    apollo?.organization?.name || (detail?.data?.company as string | undefined) || "";
  const fullName = [fname, lname].filter(Boolean).join(" ") || apollo?.name || email;

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

            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Field label="Domain" value={detail.domain} />
              <Field label="Company" value={company || "—"} />
              {apollo?.title && <Field label="Title" value={apollo.title} icon={<Briefcase className="h-3.5 w-3.5" />} />}
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
