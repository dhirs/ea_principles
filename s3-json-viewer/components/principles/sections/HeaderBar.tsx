import { Badge } from "@/components/ui/badge"
import { asObject, asString, type Principle } from "@/lib/principles/types"

export function HeaderBar({ principle }: { principle: Principle }) {
  const id = asString(principle.standard_id) ?? "—"
  const principleId = asString(principle.principle_id)
  const uValue = asString(principle.u_value)
  const uPrinciple = asString(principle.u_principle)
  const title = asString(asObject(principle.statement)?.title)

  return (
    <div className="pb-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm tracking-wider uppercase">
        <span className="font-bold text-muted-foreground">{id}</span>
        {principleId && (
          <span className="text-xs font-medium text-muted-foreground/70">
            · {principleId}
          </span>
        )}
        {uValue && (
          <Badge variant="secondary" className="font-sans normal-case tracking-normal">
            {uValue}
          </Badge>
        )}
      </div>
      {/* The aspirational principle (the "why") sits above the abstract rule (the title). */}
      {uPrinciple && (
        <p className="mt-3 max-w-3xl text-lg font-medium italic leading-snug text-foreground/75">
          {uPrinciple}
        </p>
      )}
      {title && (
        <h1 className="mt-2 text-4xl font-black leading-[1.1] tracking-tight">
          {title}
        </h1>
      )}
    </div>
  )
}
