import { NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

const SELECT =
  "apollo_org_id,company,domain,linkedin_url,employee_range,revenue,revenue_printed,hq_location,parent_company,growth_6m,growth_12m,growth_24m,added_at,sector_title,subsector_title,industry_group_title,naics_industry_title,national_industry_title";
// Biggest revenue first; unknown revenue falls to the bottom, then A→Z by name.
const ORDER = "order=revenue.desc.nullslast&order=company.asc";
const PAGE = 1000;

// GET /api/companies — list the Apollo target-company universe (read-only).
// Filter/sort/paginate all happen client-side, so we page through every row here.
// PostgREST caps a single response at max-rows (1000) and returns 200 without
// saying so, which silently truncated this list to the top 1000 by revenue.
export async function GET() {
  const base = `select=${SELECT}&${ORDER}`;
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await sb("apollo_company_universe", `${base}&limit=${PAGE}&offset=${offset}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Supabase ${res.status}`, detail: await res.text() },
        { status: 500 },
      );
    }
    const batch = (await res.json()) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }
  return NextResponse.json({ rows }, {
    headers: { "Cache-Control": "no-store" },
  });
}
