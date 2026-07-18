import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// One row per org+technology, derived from apollo_company_scores.signals via the
// `apollo_company_technology` view. This is the ONLY org<->technology evidence we
// have: Apollo's search and enrichment return no technographics on this plan, so
// the associations exist only because of the Stage 4 search probes (CDP + MAP).
const SELECT = "apollo_org_id,technology_uid,technology_name";
const PAGE = 1000; // PostgREST caps a response at 1000 rows — must page past it

type TechRow = { apollo_org_id: string; technology_uid: string; technology_name: string };

async function fetchTechnologies() {
  // MUST paginate: PostgREST returns at most 1000 rows per request. This mapping was
  // ~200 pairs (CDP only) but grew past 1000 once Stage 4 added MAP technologies
  // (~2,000 pairs). An unpaged pull silently truncated the alphabetical tail —
  // Salesforce, Segment, Snowplow, Tealium… vanished from the dropdown. Page through
  // with a stable total order until a short batch signals the end.
  const all: TechRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await sb(
      "apollo_company_technology",
      `select=${SELECT}&order=technology_name.asc,apollo_org_id.asc,technology_uid.asc` +
        `&limit=${PAGE}&offset=${offset}`,
    );
    if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
    const batch = (await res.json()) as TechRow[];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
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
