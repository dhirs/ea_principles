function formatKey(k: string) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
}

function isPrimitive(v: unknown): v is string | number | boolean | null | undefined {
  return v === null || v === undefined || ["string", "number", "boolean"].includes(typeof v)
}

function renderPrimitive(v: string | number | boolean | null | undefined) {
  if (v === null || v === undefined || v === "") return "—"
  return String(v)
}

function ValueView({ value }: { value: unknown }) {
  if (isPrimitive(value)) {
    return <span>{renderPrimitive(value)}</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>—</span>
    if (value.every(isPrimitive)) {
      return (
        <ul className="list-disc pl-5 space-y-0.5">
          {value.map((item, i) => (
            <li key={i}>{renderPrimitive(item as string | number | boolean | null | undefined)}</li>
          ))}
        </ul>
      )
    }
    return (
      <ul className="space-y-3">
        {value.map((item, i) => (
          <li key={i} className="rounded-md border border-border bg-background/50 p-3">
            <ValueView value={item} />
          </li>
        ))}
      </ul>
    )
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span>—</span>
    return (
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
        {entries.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-xs uppercase tracking-wide text-muted-foreground pt-0.5">
              {formatKey(k)}
            </dt>
            <dd className="text-foreground/90">
              <ValueView value={v} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }
  return <span>{String(value)}</span>
}

export function MetaSection({ entries }: { entries: Array<[string, unknown]> }) {
  if (entries.length === 0) return null
  return (
    <dl className="grid grid-cols-1 gap-y-5 text-sm">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{formatKey(k)}</dt>
          <dd className="mt-1 text-foreground/90">
            <ValueView value={v} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
