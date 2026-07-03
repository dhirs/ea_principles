import { NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

const SELECT =
  "apollo_org_id,company,domain,linkedin_url,employee_range,revenue,revenue_printed,hq_location,parent_company,growth_6m,growth_12m,growth_24m,added_at,sector_title,subsector_title,industry_group_title,naics_industry_title,national_industry_title";
// Biggest revenue first; unknown revenue falls to the bottom, then A→Z by name.
const ORDER = "order=revenue.desc.nullslast&order=company.asc";

// GET /api/companies — list the Apollo target-company universe (read-only).
export async function GET() {
  const res = await sb("apollo_company_universe", `select=${SELECT}&${ORDER}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  return NextResponse.json({ rows: await res.json() }, {
    headers: { "Cache-Control": "no-store" },
  });
}
