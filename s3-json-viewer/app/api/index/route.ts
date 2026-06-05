import { NextResponse } from "next/server"
import { getCachedPrinciples, REVALIDATE_SECONDS } from "@/lib/principles/s3"
import { asArray, asObject, asString, type Principle } from "@/lib/principles/types"

// Latest change date for "last updated", without shipping the full history.
function lastUpdated(p: Principle): string | undefined {
  const changes = asArray(asObject(p.change_history)?.changes) ?? []
  let latest = ""
  for (const c of changes) {
    const d = asString(asObject(c)?.date)
    if (d && d > latest) latest = d
  }
  return latest || undefined
}

function awsBestPractices(p: Principle): string[] {
  const refs = asArray(asObject(asObject(p.framework_mappings)?.aws)?.references) ?? []
  return refs
    .map((r) => asString(asObject(r)?.best_practice))
    .filter((s): s is string => !!s && !!s.trim())
}

// A list-page / sidebar-filter entry: only the fields those views read. Shaped
// so existing consumers (PrinciplesList, *Filter, context) work unchanged.
function toIndexEntry(p: Principle) {
  const statement = asObject(p.statement)
  return {
    principle_id: asString(p.principle_id),
    pillar: asString(p.pillar),
    focus_area: asString(p.focus_area),
    maturity_level: asString(p.maturity_level),
    last_updated: lastUpdated(p),
    statement: {
      title: asString(statement?.title),
      description: asString(statement?.description),
    },
    // Kept in this nested shape so getAwsBestPractices() reads it unchanged.
    framework_mappings: {
      aws: { references: awsBestPractices(p).map((bp) => ({ best_practice: bp })) },
    },
  }
}

export async function GET() {
  try {
    const data = await getCachedPrinciples()
    const principles = (asArray(data?.principles) ?? []) as Principle[]
    return NextResponse.json(
      { meta: data?.meta, principles: principles.map(toIndexEntry) },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 5}`,
        },
      },
    )
  } catch (error) {
    console.error("Error building principles index:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from S3",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
