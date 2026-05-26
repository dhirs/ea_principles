import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

let loaded = false

export function loadOuterEnv() {
  if (loaded) return
  loaded = true
  const path = resolve(process.cwd(), "..", ".env")
  if (!existsSync(path)) return
  const text = readFileSync(path, "utf8")
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
