import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// One row per org+technology, derived from apollo_company_scores.signals via the
// `apollo_company_technology` view. This is the ONLY org<->technology evidence we
// have: Apollo's search and enrichment return no technographics on this plan, so
// the associations exist only because of the Stage 4 CDP search probes. Today that
// is 198 pairs across 12 technologies / 167 orgs — it grows only when new probes run.
const SELECT = "apollo_org_id,technology_uid,technology_name";

async function fetchTechnologies() {
  // The whole mapping is tiny (~200 rows), so one unpaged pull is fine.
  const res = await sb("apollo_company_technology", `select=${SELECT}&order=technology_name.asc`);
  if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
  return (await res.json()) as { apollo_org_id: string; technology_uid: string; technology_name: string }[];
}

// The mapping only changes when the prospecting pipeline probes new technologies
// (rarely), so a long TTL is safe. Bust with revalidateTag("technologies").
const cachedTechnologies = unstable_cache(fetchTechnologies, ["technologies-mapping"], {
  revalidate: 300,
  tags: ["technologies"],
});

// GET /api/technologies — the org<->technology mapping (read-only).
export async function GET() {
  try {
    return NextResponse.json(
      { rows: await cachedTechnologies() },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
