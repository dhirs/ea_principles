import { asArray, asObject, asString } from "@/lib/principles/types"

export function ProblemSection({ node }: { node: unknown }) {
  const o = asObject(node)
  const description = asString(o?.description)
  const examples = asArray(o?.examples)?.filter((x): x is string => typeof x === "string") ?? []
  if (!description && examples.length === 0) return null
  return (
    <div className="space-y-4">
      {description && (
        <p className="leading-relaxed text-foreground/90 whitespace-pre-wrap">{description}</p>
      )}
      {examples.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-foreground/80 hover:text-foreground select-none">
            {examples.length} failure scenario{examples.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-3 space-y-2 pl-5 list-disc text-sm leading-relaxed text-foreground/80">
            {examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
