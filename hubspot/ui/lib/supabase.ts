// Server-only Supabase REST helper. Reads SUPABASE_URL + SUPABASE_KEY (secret)
// from the repo-root .env so the service key never reaches the browser.
import { readFileSync } from "node:fs";
import { join } from "node:path";

let cached: { url: string; key: string } | null = null;

function creds() {
  if (cached) return cached;
  // process.cwd() is hubspot/ui when `next dev` runs here -> repo root is ../../
  const envPath = join(process.cwd(), "..", "..", ".env");
  const text = readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
    throw new Error("SUPABASE_URL / SUPABASE_KEY missing from repo-root .env");
  }
  cached = { url: env.SUPABASE_URL.replace(/\/$/, ""), key: env.SUPABASE_KEY };
  return cached;
}

/** Call the Supabase REST API (PostgREST) against `table` with a raw query string. */
export async function sb(
  table: string,
  query: string,
  extraHeaders: Record<string, string> = {},
) {
  const { url, key } = creds();
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...extraHeaders,
    },
    cache: "no-store",
  });
  return res;
}
