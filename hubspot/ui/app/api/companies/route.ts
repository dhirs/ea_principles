import { NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

// hq_location is deliberately absent: Apollo's company-search returns no location
// field, so it is null on every row and the UI dropped the column.
const SELECT =
  "apollo_org_id,company,domain,linkedin_url,employee_range,revenue,revenue_printed,parent_company,growth_6m,growth_12m,growth_24m,added_at,sector_title,subsector_title,industry_group_title,naics_industry_title,national_industry_title";
// Biggest revenue first; unknown revenue falls to the bottom, then A→Z by name.
const ORDER = "order=revenue.desc.nullslast&order=company.asc";
const PAGE = 1000;

// The page filters/sorts/paginates client-side, so it needs every row.
// PostgREST caps a single response at max-rows (1000) and returns 200 without
// saying so — a plain select silently truncated this to the top 1000 by revenue.
// Ask for the exact total up front, then pull the remaining pages in parallel.
async function fetchCompanies() {
  const base = `select=${SELECT}&${ORDER}`;
  const first = await sb("apollo_company_universe", `${base}&limit=${PAGE}&offset=0`, {
    Prefer: "count=exact",
  });
  if (!first.ok) throw new Error(`Supabase ${first.status} — ${await first.text()}`);

  const rows = (await first.json()) as Record<string, unknown>[];
  const total =
    parseInt((first.headers.get("content-range") || "*/0").split("/")[1], 10) || rows.length;

  const offsets: number[] = [];
  for (let o = PAGE; o < total; o += PAGE) offsets.push(o);

  const rest = await Promise.all(
    offsets.map(async (offset) => {
      const res = await sb("apollo_company_universe", `${base}&limit=${PAGE}&offset=${offset}`);
      if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
      return (await res.json()) as Record<string, unknown>[];
    }),
  );

  return rest.reduce((acc, batch) => acc.concat(batch), rows);
}

// NOTE: no unstable_cache here. The full universe payload is ~2.25MB, which exceeds
// Next.js's hard 2MB data-cache limit — wrapping this in unstable_cache throws
// "items over 2MB can not be cached" and 500s the route. The fetch already pulls
// efficiently (parallel pages), and the Cache-Control header below gives the browser/
// CDN a 60s cache with stale-while-revalidate, so a per-request Supabase read is fine.
// GET /api/companies — the whole Apollo target-company universe (read-only).
export async function GET() {
  try {
    return NextResponse.json(
      { rows: await fetchCompanies() },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
