import { asArray, asObject, asString } from "@/lib/principles/types"

// Renders the principle's `references` field — real-world evidence links
// ({ url, title, source, note, date }) that the principle's failure mode
// occurs in industry. Distinct from the synthetic `problem.examples`.
// The registry's isEmptyNode check hides this tab when references is [].
export function ReferencesSection({ node }: { node: unknown }) {
  const refs = asArray(node) ?? []
  if (refs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No real-world references mapped to this principle yet.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {refs.map((r, i) => {
        const o = asObject(r)
        const url = asString(o?.url)
        const title = asString(o?.title) ?? url ?? "Untitled reference"
        const source = asString(o?.source)
        const note = asString(o?.note)
        const date = asString(o?.date)
        return (
          <li key={i} className="rounded-md border border-border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {url ? (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {title}
                </a>
              ) : (
                <span className="font-medium">{title}</span>
              )}
              {source && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                  {source}
                </span>
              )}
            </div>
            {note && <p className="mt-1.5 text-muted-foreground">{note}</p>}
            {date && (
              <p className="mt-1 text-xs text-muted-foreground/70">Captured {date}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
