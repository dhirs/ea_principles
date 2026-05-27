import { asArray, asObject, asString } from "@/lib/principles/types"

export function SolutionSection({ node }: { node: unknown }) {
  const o = asObject(node)
  const approach = asString(o?.approach)
  const benefits = asArray(o?.key_benefits)?.filter((x): x is string => typeof x === "string") ?? []
  if (!approach && benefits.length === 0) return null
  return (
    <div className="space-y-4">
      {approach && (
        <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">{approach}</p>
      )}
      {benefits.length > 0 && (
        <div>
          <div className="text-sm font-medium text-foreground/80 mb-2">Key benefits</div>
          <ul className="space-y-1.5 pl-5 list-disc text-sm leading-relaxed text-foreground/80">
            {benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
