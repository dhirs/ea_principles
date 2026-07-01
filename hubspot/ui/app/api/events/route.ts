import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

const SELECT = "id,event_name,date_of_event,event_url,event_description,created_at";
// Newest event date first; undated events fall to the bottom.
const ORDER = "order=date_of_event.desc.nullslast&order=created_at.desc";

// GET /api/events — list all events.
export async function GET() {
  const res = await sb("maven_events", `select=${SELECT}&${ORDER}`);
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  return NextResponse.json({ rows: await res.json() }, {
    headers: { "Cache-Control": "no-store" },
  });
}

// POST /api/events — create an event.
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const event_name = String(body.event_name ?? "").trim();
  if (!event_name) {
    return NextResponse.json({ error: "event_name required" }, { status: 400 });
  }

  const row = {
    event_name,
    date_of_event: (body.date_of_event as string) || null,
    event_url: (String(body.event_url ?? "").trim()) || null,
    event_description: (String(body.event_description ?? "").trim()) || null,
  };

  const res = await sb(
    "maven_events",
    "",
    { "Content-Type": "application/json", Prefer: "return=representation" },
    { method: "POST", body: JSON.stringify(row) },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  const rows = await res.json();
  return NextResponse.json(rows[0], { status: 201 });
}
