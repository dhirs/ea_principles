import { NextResponse } from "next/server"
import { getCachedPrinciples, REVALIDATE_SECONDS } from "@/lib/principles/s3"

export async function GET() {
  try {
    const jsonData = await getCachedPrinciples()
    return NextResponse.json(jsonData, {
      headers: {
        "Cache-Control": `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=${REVALIDATE_SECONDS * 5}`,
      },
    })
  } catch (error) {
    console.error("Error fetching from S3:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch data from S3",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
