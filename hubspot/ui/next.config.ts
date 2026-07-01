import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Load the repo-root .env (../../.env) into process.env at startup. This app's
// secrets (SUPABASE_*, CRM_SESSION_SECRET) live there, not in a local .env, and
// the Edge middleware needs CRM_SESSION_SECRET available in process.env.
// Existing env vars win, so the real environment still overrides the file.
try {
  const text = readFileSync(join(process.cwd(), "..", "..", ".env"), "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // No repo-root .env (e.g. CI) — rely on the real environment instead.
}

const nextConfig: NextConfig = {};

export default nextConfig;
