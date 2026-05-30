import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// Reference Implementation README files live at the repo root, outside the
// Next.js app dir, at: <repo>/agentflow/ri/<principle_id>/README.md
// `process.cwd()` is the app root (s3-json-viewer/), so the repo root is one up.
const RI_ROOT = path.join(process.cwd(), "..", "agentflow", "ri")

// Principle ids look like "GO1B1-01". Restrict to a safe charset so the id
// can never escape RI_ROOT via path traversal.
const ID_RE = /^[A-Za-z0-9_-]+$/

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId)

  if (!ID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid principle id" }, { status: 400 })
  }

  const filePath = path.join(RI_ROOT, id, "README.md")

  try {
    const content = await readFile(filePath, "utf8")
    return NextResponse.json({ content })
  } catch {
    return NextResponse.json(
      { error: `No reference implementation for ${id}` },
      { status: 404 },
    )
  }
}
