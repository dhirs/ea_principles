"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Download, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LeadDetail } from "@/components/LeadDetail";

const PAGE_SIZES = [10, 50, 100];

type EventOpt = { id: string; event_name: string; date_of_event: string | null };

type Record = {
  email: string;
  name: string;
  company: string | null;
  title: string | null;
  enriched: boolean;
  attended: boolean | null;
  attended_live: boolean | null;
  signup_date: string | null;
  source: string | null;
};

export function MavenAttendanceReport() {
  const [events, setEvents] = useState<EventOpt[]>([]);
  const [eventId, setEventId] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [attendedCount, setAttendedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<string | null>(null);
  const [enrichedOnly, setEnrichedOnly] = useState(false);

  // Load the event dropdown once.
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.rows ?? []));
  }, []);

  // Load attendance whenever the selected event changes.
  useEffect(() => {
    if (!eventId) {
      setRecords([]);
      setAttendedCount(0);
      return;
    }
    setLoading(true);
    fetch(`/api/reports/attendance?event_id=${eventId}`)
      .then((r) => r.json())
      .then((d) => {
        setRecords(d.records ?? []);
        setAttendedCount(d.attended ?? 0);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  // Only people who actually attended the event. Search runs within those.
  const attendees = useMemo(() => records.filter((r) => r.attended), [records]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return attendees.filter((r) => {
      if (enrichedOnly && !r.enriched) return false;
      if (!needle) return true;
      return (
        r.email.toLowerCase().includes(needle) ||
        r.name.toLowerCase().includes(needle)
      );
    });
  }, [q, attendees, enrichedOnly]);

  // Reset to the first page whenever the result set or page size changes.
  useEffect(() => setPage(0), [eventId, q, pageSize, enrichedOnly]);

  function downloadCsv() {
    const cols = [
      ["email", "Email"],
      ["name", "Name"],
      ["company", "Company"],
      ["title", "Title"],
      ["enriched", "Enriched"],
      ["attended", "Attended"],
      ["attended_live", "Attended live"],
      ["signup_date", "Signup date"],
      ["source", "Source"],
    ] as const;
    const esc = (v: unknown) => {
      const s = v === true ? "Yes" : v === false ? "No" : v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      cols.map(([, h]) => h).join(","),
      ...filtered.map((r) => cols.map(([k]) => esc((r as Record<string, unknown>)[k])).join(",")),
    ];
    const eventName = events.find((e) => e.id === eventId)?.event_name ?? "event";
    const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const pageRows = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const from = filtered.length === 0 ? 0 : page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, filtered.length);

  return (
    <div>
      {/* Event picker + search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-72">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value);
              setQ("");
            }}
            className="h-10 w-full appearance-none rounded-lg border bg-card px-9 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Select an event…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_name}
                {e.date_of_event ? ` — ${e.date_of_event}` : ""}
              </option>
            ))}
          </select>
        </div>

        {eventId && (
          <div className="relative min-w-64 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search email or name…"
              className="pl-9"
            />
          </div>
        )}

        {eventId && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={enrichedOnly}
              onChange={(e) => setEnrichedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-input accent-primary"
            />
            Enriched only
          </label>
        )}
      </div>

      {!eventId ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Select an event to see who registered and who attended.
        </p>
      ) : loading ? (
        <div className="rounded-xl border bg-card p-16 text-center text-muted-foreground">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {records.length.toLocaleString()} registered · {attendedCount.toLocaleString()} attended
              {(q || enrichedOnly) && ` · ${filtered.length.toLocaleString()} shown`}
            </p>
            <Button variant="outline" size="sm" onClick={downloadCsv} disabled={filtered.length === 0}>
              <Download className="h-4 w-4" /> Download CSV
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[20%]" />
                <col className="w-[20%]" />
                <col className="w-[14%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Attended</th>
                  <th className="px-4 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                      No records match.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr key={r.email} className="border-b last:border-0">
                      <td className="break-words px-4 py-3">
                        <button
                          onClick={() => setSelected(r.email)}
                          className="text-primary hover:underline"
                        >
                          {r.email}
                        </button>
                      </td>
                      <td className="break-words px-4 py-3 font-medium">{r.name || "—"}</td>
                      <td className="break-words px-4 py-3 text-muted-foreground">
                        {r.company || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <AttendedBadge attended={r.attended} live={r.attended_live} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {r.signup_date || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 appearance-none rounded-lg border bg-card pl-3 pr-8 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <span className="tabular-nums">
                {from.toLocaleString()}–{to.toLocaleString()} of {filtered.length.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                {page + 1} / {lastPage + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {selected && <LeadDetail email={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function AttendedBadge({ attended, live }: { attended: boolean | null; live: boolean | null }) {
  if (attended) {
    return (
      <span className="inline-flex items-center rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-600">
        {live ? "Attended (live)" : "Attended"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      No
    </span>
  );
}
