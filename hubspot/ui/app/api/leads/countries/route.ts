import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// Distinct lead countries + counts, from the `lead_country_counts` view (leads whose
// data->apollo->>country is set — i.e. enriched leads). Powers the Country filter
// dropdown so it always reflects the live data instead of a hardcoded, staling list.
type CountryRow = { country: string; n: number };

async function fetchCountries() {
  const res = await sb("lead_country_counts", "select=country,n&order=n.desc,country.asc");
  if (!res.ok) throw new Error(`Supabase ${res.status} — ${await res.text()}`);
  return (await res.json()) as CountryRow[];
}

// Refreshes when new leads land; busts with revalidateTag("leads") like the other
// leads-backed routes.
const cachedCountries = unstable_cache(fetchCountries, ["lead-countries"], {
  revalidate: 60,
  tags: ["leads"],
});

export async function GET() {
  try {
    return NextResponse.json(
      { rows: await cachedCountries() },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
