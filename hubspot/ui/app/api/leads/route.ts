import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { sb } from "@/lib/supabase";

const PAGE_SIZE = 10;
const SELECT =
  "email,fname,lname,domain,seg,seg_override,company:data->>company,title:data->apollo->>title,apollo_id:data->apollo->>id," +
  "a_fname:data->apollo->>first_name,a_lname:data->apollo->>last_name,a_company:data->apollo->organization->>name";

// Newest first. updated_at is set on insert (upsert), so it doubles as "added".
const ORDER = "order=updated_at.desc&order=email.asc";

const SENIORITY = new Set(["Senior", "Mid", "Entry", "Unknown"]);

async function fetchLeads(q: string, filter: string, seg: string, page: number) {
  const parts = [`select=${SELECT}`, ORDER];
  if (q) {
    const like = `*${q.replace(/[*,()]/g, "")}*`;
    parts.push(
      `or=(email.ilike.${like},fname.ilike.${like},lname.ilike.${like},domain.ilike.${like})`,
    );
  }
  if (filter === "enriched") parts.push("data->apollo->>id=not.is.null");
  if (filter === "cold") parts.push("data->apollo->>id=is.null");
  if (SENIORITY.has(seg)) parts.push(`seg=eq.${seg}`);

  const query = `${parts.join("&")}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`;
  const res = await sb("leads", query, { Prefer: "count=exact" });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);

  const rows = await res.json();
  const total = parseInt((res.headers.get("content-range") || "*/0").split("/")[1], 10) || 0;
  return { rows, total, page, pageSize: PAGE_SIZE };
}

// Cache each (q, filter, seg, page) combination for 60s. The first page (no
// query, no filter) is the common landing view, so it's served from cache on
// reload instead of re-hitting Supabase. Args are folded into the cache key.
const cachedFetchLeads = unstable_cache(fetchLeads, ["leads-list"], {
  revalidate: 60,
  tags: ["leads"],
});

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const filter = sp.get("filter") || "all";
  const seg = sp.get("seg") || "";
  const page = Math.max(0, parseInt(sp.get("page") || "0", 10) || 0);

  try {
    const data = await cachedFetchLeads(q, filter, seg, page);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
