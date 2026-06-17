import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const res = await sb(
    "leads",
    `select=email,fname,lname,domain,data,updated_at&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  const rows = await res.json();
  if (!rows.length) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}
