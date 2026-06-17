import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { sb } from "@/lib/supabase";

// Allowed manual seniority overrides. `null` reverts to the auto (title-inferred)
// value. NEVER write `seg` — it's a generated column = coalesce(seg_override, …).
const ALLOWED = new Set(["Senior", "Mid", "Entry", "Unknown"]);

export async function PATCH(req: NextRequest) {
  let body: { email?: string; seg_override?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  // Validate: must be one of the allowed buckets, or null (Auto).
  const seg_override = body.seg_override ?? null;
  if (seg_override !== null && !ALLOWED.has(seg_override)) {
    return NextResponse.json(
      { error: `seg_override must be one of ${[...ALLOWED].join(", ")} or null` },
      { status: 400 },
    );
  }

  const res = await sb(
    "leads",
    `email=eq.${encodeURIComponent(email)}`,
    { "Content-Type": "application/json", Prefer: "return=representation" },
    { method: "PATCH", body: JSON.stringify({ seg_override }) },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }

  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "lead not found" }, { status: 404 });
  }

  // Invalidate the cached list/stats so the table reflects the new seg.
  revalidateTag("leads");

  // Return the recomputed row (incl. generated `seg`).
  return NextResponse.json(rows[0]);
}
