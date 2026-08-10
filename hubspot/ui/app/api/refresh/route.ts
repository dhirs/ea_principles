import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// POST /api/refresh — bust the server-side caches.
//
// The read routes wrap their Supabase fetches in `unstable_cache` with long TTLs
// (companies 300s, categories 300s, technologies 300s, countries 60s), because the
// underlying data only changes when the prospecting pipeline runs or someone curates
// a label by hand. Without this endpoint the only way to see such a change was to
// wait out the TTL — which silently made the UI look wrong right after a labelling
// pass. `/api/leads/seg` already did this for the "leads" tag; this generalises it.
//
// Body (optional): {"tags": ["company-categories"]} to bust a subset. No body busts
// everything. Next 16 requires a cache-life profile on revalidateTag; "max"
// invalidates every entry carrying the tag.
const ALL_TAGS = ["companies", "company-categories", "technologies", "leads"] as const;

export async function POST(req: NextRequest) {
  let tags: string[] = [...ALL_TAGS];
  try {
    const body = await req.json();
    if (Array.isArray(body?.tags) && body.tags.length > 0) {
      tags = body.tags.filter((t: unknown): t is string => typeof t === "string");
    }
  } catch {
    // No body, or not JSON — refresh everything.
  }

  const unknown = tags.filter((t) => !ALL_TAGS.includes(t as (typeof ALL_TAGS)[number]));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: `unknown tag(s): ${unknown.join(", ")}`, known: ALL_TAGS },
      { status: 400 },
    );
  }

  for (const tag of tags) revalidateTag(tag, "max");
  return NextResponse.json({ revalidated: tags });
}
