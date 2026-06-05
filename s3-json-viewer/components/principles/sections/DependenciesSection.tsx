import Link from "next/link"
import { asArray, asObject, asString } from "@/lib/principles/types"

export function DependenciesSection({ node }: { node: unknown }) {
  const deps = asArray(node) ?? []
  if (deps.length === 0) {
    return <p className="text-sm text-muted-foreground">No dependencies.</p>
  }

  return (
    <ul className="space-y-3">
      {deps.map((d, i) => {
        const o = asObject(d)
        const id = asString(o?.principle_id)
        const kind = asString(o?.kind)
        const reason = asString(o?.reason)
        return (
          <li key={i} className="rounded-md border border-border p-3 text-sm">
            <div className="flex items-center gap-2">
              {id ? (
                <Link
                  href={`/principles/${id}`}
                  className="font-mono font-medium text-primary hover:underline"
                >
                  {id}
                </Link>
              ) : (
                <span className="font-mono font-medium">{asString(d) ?? JSON.stringify(d)}</span>
              )}
              {kind && (
                <span
                  className={`rounded px-1.5 py-0.5 text-xs uppercase tracking-wide ${
                    kind === "hard"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {kind}
                </span>
              )}
            </div>
            {reason && <p className="mt-1.5 text-muted-foreground">{reason}</p>}
          </li>
        )
      })}
    </ul>
  )
}
