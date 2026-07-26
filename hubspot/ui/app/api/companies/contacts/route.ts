import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

// Contacts at one account, for the company drawer.
//
// The join key is `lead_provenance.evidence->>apollo_org_id`, NOT
// `leads.data->apollo->>organization_id`. Both usually agree, but the provenance
// value is OUR resolution against apollo_company_universe at search time and is
// guaranteed to name a real universe account; Apollo's own field can drift to an
// employer outside the universe (verified 2026-07-20: 1 of 1,202 leads had moved to
// an unrelated org in the revealed record). Joining on Apollo's field would silently
// drop that contact from its account.
//
// We match ANY provenance whose evidence names this org — currently
// `title_match_universe` (Stage-6 People-search) and `martech_uk_list` (imported
// contacts lists), and any future org-scoped reason. We deliberately do NOT filter
// by source_type: an early version pinned it to `title_match_universe`, which hid
// every contacts-list lead from its company (a UK list company showed "no contacts"
// despite having them). `maven_workshop` rows carry no apollo_org_id in evidence, so
// the org filter already excludes them.
export async function GET(req: NextRequest) {
  const orgId = (req.nextUrl.searchParams.get("apollo_org_id") || "").trim();
  if (!orgId) return NextResponse.json({ error: "apollo_org_id required" }, { status: 400 });

  const res = await sb(
    "lead_provenance",
    `select=email,evidence,source_type,leads(fname,lname,seg,domain)` +
      `&evidence->>apollo_org_id=eq.${encodeURIComponent(orgId)}`,
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }

  type Row = {
    email: string;
    evidence: { title?: string; seniority?: string } | null;
    source_type: string;
    leads: { fname?: string | null; lname?: string | null; seg?: string | null } | null;
  };
  const rows: Row[] = await res.json();

  // A person can carry more than one org-scoped reason (e.g. title_match_universe AND
  // martech_uk_list) — collapse to one contact per email so the drawer never lists a
  // name twice. First row wins; both carry the same title/seniority evidence.
  const byEmail = new Map<string, Row>();
  for (const r of rows) if (!byEmail.has(r.email)) byEmail.set(r.email, r);

  // Most senior first — the order you would actually work the account in.
  const RANK: Record<string, number> = { c_suite: 0, founder: 0, owner: 0, head: 1, vp: 2, director: 3 };
  const contacts = [...byEmail.values()]
    .map((r) => ({
      email: r.email,
      name: [r.leads?.fname, r.leads?.lname].filter(Boolean).join(" ") || r.email,
      title: r.evidence?.title ?? null,
      seniority: r.evidence?.seniority ?? null,
      seg: r.leads?.seg ?? null,
    }))
    .sort(
      (a, b) =>
        (RANK[a.seniority ?? ""] ?? 9) - (RANK[b.seniority ?? ""] ?? 9) ||
        a.name.localeCompare(b.name),
    );

  return NextResponse.json({ contacts });
}
