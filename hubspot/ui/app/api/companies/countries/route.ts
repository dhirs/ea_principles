import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// One row per company that has a country, derived from its leads via the
// `company_country` view (a company's country = the modal country of its leads,
// since Apollo puts location on the person, not the company object). The Companies
// page merges this into its rows client-side, exactly like /api/technologies.
const SELECT = "apollo_org_id,country";
const PAGE = 1000; // PostgREST caps a response at 1000 rows — page past it

type CountryRow = { apollo_org_id: string; country: string };

async function fetchCompanyCountries() {
  const all: CountryRow[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await sb(
      "company_country",
      `select=${SELECT}&order=apollo_org_id.asc&limit=${PAGE}&offset=${offset}`,
    );
    if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
    const batch = (await res.json()) as CountryRow[];
    all.push(...batch);
    if (batch.length < PAGE) break;
  }
  return all;
}

// Refreshes when leads change (new country-bearing leads → more company coverage);
// busts with revalidateTag("leads").
const cachedCompanyCountries = unstable_cache(fetchCompanyCountries, ["company-countries"], {
  revalidate: 60,
  tags: ["leads"],
});

export async function GET() {
  try {
    return NextResponse.json(
      { rows: await cachedCompanyCountries() },
      { headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
