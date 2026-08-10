import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// The custom taxonomy: a curated business-model label per company, scoped to a NAICS
// subsector. NAICS cannot separate a buyout firm from a wealth manager (both are
// 523940), so this layer sits beside the NAICS hierarchy. Rationale + schema:
// prospecting/adr/2026-08-10-company-custom-taxonomy.md
//
// Two payloads, because the dropdown needs both:
//  - `vocabulary` — every identifier defined for a subsector, so the filter can list
//    them all once a subsector is picked, including ones with no matches right now.
//  - `rows`       — org -> identifier, so the page can count and filter client-side.
const PAGE = 1000; // PostgREST caps a response at 1000 rows — must page past it

type CategoryRow = { apollo_org_id: string; subsector_code: string; slug: string; label: string };
type VocabRow = { subsector_code: string; slug: string; label: string; sort_order: number };

async function fetchAll<T>(table: string, query: string) {
  const all: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await sb(table, `${query}&limit=${PAGE}&offset=${offset}`);
    if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
    const batch = (await res.json()) as T[];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

async function fetchCategories() {
  const [vocabulary, rows] = await Promise.all([
    fetchAll<VocabRow>(
      "company_category",
      "select=subsector_code,slug,label,sort_order&order=subsector_code.asc,sort_order.asc,slug.asc",
    ),
    fetchAll<CategoryRow>(
      "company_custom_taxonomy",
      "select=apollo_org_id,subsector_code,slug,label&order=apollo_org_id.asc",
    ),
  ]);
  return { vocabulary, rows };
}

// Assignments only change when someone curates them, so a long TTL is safe. Bust
// with revalidateTag("company-categories") after a labelling pass.
const cachedCategories = unstable_cache(fetchCategories, ["company-categories"], {
  revalidate: 300,
  tags: ["company-categories"],
});

// GET /api/companies/categories — the custom-taxonomy vocabulary + assignments.
export async function GET() {
  try {
    return NextResponse.json(await cachedCategories(), {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
