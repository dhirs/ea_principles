"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { NavPanel } from "@/components/NavPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EventRow = {
  id: string;
  event_name: string;
  date_of_event: string | null;
  event_url: string | null;
  event_description: string | null;
  created_at: string;
};

type Draft = {
  event_name: string;
  date_of_event: string;
  event_url: string;
  event_description: string;
};

const EMPTY: Draft = { event_name: "", date_of_event: "", event_url: "", event_description: "" };

export default function EventsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EventRow | "new" | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/events");
    const data = await res.json();
    setRows(data.rows ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(ev: EventRow) {
    if (!confirm(`Delete "${ev.event_name}"? This also removes its attendance records.`)) return;
    const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Delete failed: " + (await res.text()));
      return;
    }
    load();
  }

  return (
    <div className="flex">
      <NavPanel />

      <main className="min-w-0 flex-1 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading…" : `${rows.length} event${rows.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> New event
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[14%]" />
              <col className="w-[40%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-muted-foreground">
                    No events yet. Create your first one.
                  </td>
                </tr>
              ) : (
                rows.map((ev) => (
                  <tr key={ev.id} className="border-b last:border-0">
                    <td className="break-words px-4 py-3">
                      <div className="font-medium">{ev.event_name}</div>
                      {ev.event_url && (
                        <a
                          href={ev.event_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline break-all"
                        >
                          {ev.event_url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {ev.date_of_event || "—"}
                    </td>
                    <td className="break-words px-4 py-3 text-muted-foreground">
                      {ev.event_description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => setEditing(ev)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => remove(ev)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {editing && (
        <EventDialog
          event={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function EventDialog({
  event,
  onClose,
  onSaved,
}: {
  event: EventRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(
    event
      ? {
          event_name: event.event_name,
          date_of_event: event.date_of_event ?? "",
          event_url: event.event_url ?? "",
          event_description: event.event_description ?? "",
        }
      : EMPTY,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function save() {
    if (!draft.event_name.trim()) {
      setError("Event name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(event ? `/api/events/${event.id}` : "/api/events", {
      method: event ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Save failed.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays className="h-5 w-5" />
            {event ? "Edit event" : "New event"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <Field label="Event name *">
            <Input value={draft.event_name} onChange={set("event_name")} placeholder="Jun 22 Workshop" />
          </Field>
          <Field label="Date">
            <Input type="date" value={draft.date_of_event} onChange={set("date_of_event")} />
          </Field>
          <Field label="Event URL">
            <Input value={draft.event_url} onChange={set("event_url")} placeholder="https://…" />
          </Field>
          <Field label="Description">
            <textarea
              value={draft.event_description}
              onChange={set("event_description")}
              rows={3}
              placeholder="Short description…"
              className="flex w-full rounded-lg border bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {event ? "Save changes" : "Create event"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
