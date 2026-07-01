import { NextRequest, NextResponse } from "next/server";
import { sb } from "@/lib/supabase";

const UUID = /^[0-9a-fA-F-]{36}$/;
const PAGE = 1000;

// Embed the lead's name/company off the FK (maven_attendance.lead_email -> leads.email).
const SELECT =
  "lead_email,signup_date,attended,attended_live,source," +
  "leads(fname,lname,company:data->>company,title:data->apollo->>title," +
  "a_fname:data->apollo->>first_name,a_lname:data->apollo->>last_name," +
  "a_id:data->apollo->>id)";

type Lead = {
  fname: string | null;
  lname: string | null;
  company: string | null;
  title: string | null;
  a_fname: string | null;
  a_lname: string | null;
  a_id: string | null;
} | null;

// GET /api/reports/attendance?event_id=<uuid>
// Returns every attendance record for the event, with the lead's name flattened.
// Search is done client-side, so we page through all rows here.
export async function GET(req: NextRequest) {
  const eventId = (req.nextUrl.searchParams.get("event_id") || "").trim();
  if (!UUID.test(eventId)) {
    return NextResponse.json({ error: "valid event_id required" }, { status: 400 });
  }

  const base = `event_id=eq.${eventId}&select=${SELECT}&order=attended.desc,lead_email.asc`;
  const rows: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const res = await sb("maven_attendance", `${base}&limit=${PAGE}&offset=${offset}`);
    if (!res.ok) {
      return NextResponse.json(
        { error: `Supabase ${res.status}`, detail: await res.text() },
        { status: 500 },
      );
    }
    const batch = (await res.json()) as Record<string, unknown>[];
    rows.push(...batch);
    if (batch.length < PAGE) break;
  }

  const records = rows.map((r) => {
    const lead = r.leads as Lead;
    const fname = lead?.a_fname || lead?.fname || "";
    const lname = lead?.a_lname || lead?.lname || "";
    return {
      email: r.lead_email as string,
      name: `${fname} ${lname}`.trim(),
      company: lead?.company || null,
      title: lead?.title || null,
      enriched: Boolean(lead?.a_id),
      attended: r.attended as boolean | null,
      attended_live: r.attended_live as boolean | null,
      signup_date: r.signup_date as string | null,
      source: r.source as string | null,
    };
  });

  return NextResponse.json(
    { count: records.length, attended: records.filter((r) => r.attended).length, records },
    { headers: { "Cache-Control": "no-store" } },
  );
}
