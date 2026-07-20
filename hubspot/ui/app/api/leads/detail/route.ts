import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const res = await sb(
    "leads",
    `select=email,fname,lname,domain,seg,seg_override,data,updated_at&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  const rows = await res.json();
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Why is this person a lead? One row per reason-type (Stage 6 `lead_provenance`):
  // 'maven_workshop' for a workshop attendee, 'title_match_universe' for a target
  // title at a qualified account. A lead can carry BOTH — that combination is the
  // strongest signal, so render every row rather than picking one.
  const prov = await sb(
    "lead_provenance",
    `select=source_type,source,evidence,observed_at,source_version&email=eq.${encodeURIComponent(email)}&order=observed_at.desc`,
  );
  // Provenance is additive context — never fail the drawer over it.
  type Prov = { source_type: string; evidence?: { apollo_org_id?: string } | null };
  const provenance: Prov[] = prov.ok ? await prov.json() : [];

  // Our INTERNAL record of the lead's employer, from apollo_company_universe.
  // The org id comes from provenance evidence, not leads.data->apollo->organization_id:
  // the provenance value is our own resolution against the universe at search time and
  // always names a qualified account, whereas Apollo's field can drift to an employer
  // outside the universe (1 of 1,202 leads does — it would render a dead link here).
  // Maven-only leads have no universe account, so `company` stays null for them.
  const orgId =
    provenance.find((p) => p.source_type === "title_match_universe")?.evidence
      ?.apollo_org_id ?? null;

  let company = null;
  if (orgId) {
    const co = await sb(
      "apollo_company_universe",
      `select=apollo_org_id,company,domain,linkedin_url,revenue_printed,parent_company,` +
        `sector_title,subsector_title,naics_industry_title,growth_12m,added_at` +
        `&apollo_org_id=eq.${encodeURIComponent(orgId)}&limit=1`,
    );
    if (co.ok) company = (await co.json())[0] ?? null;
  }

  return NextResponse.json({ ...rows[0], provenance, company });
}
