import { NextResponse } from "next/server"
import { getCachedPrinciples, REVALIDATE_SECONDS } from "@/lib/principles/s3"
import { asArray, asString, type Principle } from "@/lib/principles/types"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const data = await getCachedPrinciples()
    const principles = (asArray(data?.standards) ?? []) as Principle[]
    const principle = principles.find((p) => asString(p.standard_id) === id)
    if (!principle) {
      return NextResponse.json({ error: `No principle with id ${id}` }, { status: 404 })
    }
    return NextResponse.json(principle, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 5}`,
      },
    })
  } catch (error) {
    console.error("Error fetching principle from S3:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from S3",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
