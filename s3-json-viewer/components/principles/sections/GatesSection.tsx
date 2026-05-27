import { Badge } from "@/components/ui/badge"
import { asArray, asObject, asString } from "@/lib/principles/types"

export function GatesSection({ node }: { node: unknown }) {
  const items = asArray(node) ?? []
  if (items.length === 0) return null
  return (
    <ul className="space-y-3">
      {items.map((raw, i) => {
        const g = asObject(raw)
        const point = asString(g?.point)
        const check = asString(g?.check)
        const blocking = g?.blocking === true
        return (
          <li key={i} className="rounded-xl bg-card p-5 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              {point && (
                <Badge variant="secondary" className="font-mono">
                  {point}
                </Badge>
              )}
              {blocking ? (
                <span className="text-xs px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-medium">
                  Blocking
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  Advisory
                </span>
              )}
            </div>
            {check && (
              <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                {check}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
