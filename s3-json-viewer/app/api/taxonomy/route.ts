import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// principle_schema.json lives at the repo root, outside the Next.js app dir,
// at: <repo>/data/principle_schema.json
// `process.cwd()` is the app root (s3-json-viewer/), so the repo root is one up.
const SCHEMA_PATH = path.join(process.cwd(), "..", "data", "principle_schema.json")

export async function GET() {
  try {
    const raw = await readFile(SCHEMA_PATH, "utf8")
    return NextResponse.json(JSON.parse(raw))
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to read principle_schema.json",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
