import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

const UUID = /^[0-9a-fA-F-]{36}$/;

// PATCH /api/events/[id] — update an event.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if ("event_name" in body) {
    const name = String(body.event_name ?? "").trim();
    if (!name) return NextResponse.json({ error: "event_name cannot be empty" }, { status: 400 });
    patch.event_name = name;
  }
  if ("date_of_event" in body) patch.date_of_event = (body.date_of_event as string) || null;
  if ("event_url" in body) patch.event_url = (String(body.event_url ?? "").trim()) || null;
  if ("event_description" in body)
    patch.event_description = (String(body.event_description ?? "").trim()) || null;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "no fields to update" }, { status: 400 });
  }

  const res = await sb(
    "maven_events",
    `id=eq.${id}`,
    { "Content-Type": "application/json", Prefer: "return=representation" },
    { method: "PATCH", body: JSON.stringify(patch) },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  return NextResponse.json(rows[0]);
}

// DELETE /api/events/[id] — delete an event (cascades to maven_attendance).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const res = await sb("maven_events", `id=eq.${id}`, {}, { method: "DELETE" });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Supabase ${res.status}`, detail: await res.text() },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true });
}
