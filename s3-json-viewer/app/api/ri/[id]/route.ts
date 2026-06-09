import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"

// Reference Implementation README files live at the repo root, outside the
// Next.js app dir, at: <repo>/data/ri/<bp_code-NN>/README.md
// `process.cwd()` is the app root (s3-json-viewer/), so the repo root is one up.
const RI_ROOT = path.join(process.cwd(), "..", "data", "ri")

// RI dirs are named by the bare bp_code body (e.g. "GO1B1-01"), but nodes are
// now identified by a prefixed id ("ST-GO1B1-01" / "PR-GO1B1-01"). Strip a
// leading ST-/PR- so a standard_id resolves to its RI dir. Restrict to a safe
// charset so the id can never escape RI_ROOT via path traversal.
const ID_RE = /^[A-Za-z0-9_-]+$/

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params
  const id = decodeURIComponent(rawId).replace(/^(ST|PR)-/, "")

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
