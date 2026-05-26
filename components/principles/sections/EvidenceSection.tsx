import { asArray, asObject, asString } from "@/lib/principles/types"

export function EvidenceSection({ node }: { node: unknown }) {
  const o = asObject(node)
  if (!o) return null
  const artefacts = asArray(o.artefacts) ?? []
  const reviewMode = asString(o.review_mode)
  const signOff = asString(o.sign_off)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {reviewMode && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Review Mode</div>
            <div className="mt-0.5">{reviewMode}</div>
          </div>
        )}
        {signOff && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Sign Off</div>
            <div className="mt-0.5">{signOff}</div>
          </div>
        )}
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
          Artefacts ({artefacts.length})
        </div>
        {artefacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">None listed.</p>
        ) : (
          <ul className="space-y-1 text-sm pl-5 list-disc">
            {artefacts.map((a, i) => (
              <li key={i} className="font-mono">
                {typeof a === "string" ? a : JSON.stringify(a)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
