import { asObject, asString, type Principle } from "@/lib/principles/types"

export function HeaderBar({ principle }: { principle: Principle }) {
  const id = asString(principle.principle_id) ?? "—"
  const title = asString(asObject(principle.statement)?.title)

  return (
    <div className="pb-6">
      <div className="font-mono font-bold text-sm tracking-wider text-muted-foreground uppercase">
        {id}
      </div>
      {title && (
        <h1 className="mt-2 text-4xl font-black leading-[1.1] tracking-tight">
          {title}
        </h1>
      )}
    </div>
  )
}
