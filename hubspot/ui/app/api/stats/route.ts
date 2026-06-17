import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

// Counts only — uses PostgREST `Prefer: count=exact` with limit=1, so the count
// comes back in the content-range header and NO rows are transferred.
async function count(query: string): Promise<number> {
  const res = await sb("leads", `select=email&${query}limit=1`, {
    Prefer: "count=exact",
  });
  return parseInt((res.headers.get("content-range") || "*/0").split("/")[1], 10) || 0;
}

async function fetchStats() {
  const [total, enriched] = await Promise.all([
    count(""),
    count("data->apollo->>id=not.is.null&"),
  ]);
  return { total, enriched, cold: total - enriched };
}

const cachedStats = unstable_cache(fetchStats, ["leads-stats"], {
  revalidate: 60,
  tags: ["leads"],
});

export async function GET() {
  try {
    return NextResponse.json(await cachedStats(), {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
