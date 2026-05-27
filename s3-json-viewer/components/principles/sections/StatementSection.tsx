import { asObject, asString } from "@/lib/principles/types"

export function StatementSection({ node }: { node: unknown }) {
  const description = asString(asObject(node)?.description)
  if (!description) return null
  return (
    <p className="text-base leading-relaxed text-foreground/90">{description}</p>
  )
}
