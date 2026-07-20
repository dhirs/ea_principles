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
export async function GET(req: NextRequest) {
  const orgId = (req.nextUrl.searchParams.get("apollo_org_id") || "").trim();
  if (!orgId) return NextResponse.json({ error: "apollo_org_id required" }, { status: 400 });

  const res = await sb(
    "lead_provenance",
    `select=email,evidence,leads(fname,lname,seg,domain)` +
      `&source_type=eq.title_match_universe` +
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
    leads: { fname?: string | null; lname?: string | null; seg?: string | null } | null;
  };
  const rows: Row[] = await res.json();

  // Most senior first — the order you would actually work the account in.
  const RANK: Record<string, number> = { c_suite: 0, founder: 0, owner: 0, head: 1, vp: 2, director: 3 };
  const contacts = rows
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
