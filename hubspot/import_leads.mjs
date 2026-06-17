// Upsert leads.json into the Supabase `leads` table (keyed by email).
// Usage: node hubspot/import_leads.mjs [path-to-json]   (default: hubspot/leads.json)
//
// Input: a JSON array of records shaped like
//   { "email": "...", "first_name": "...", "last_name": "...", "company": "...", "apollo": {...}|null }
//
// Mapping per row:
//   email           -> email   (lowercased, trimmed; upsert key / PK)
//   first_name      -> fname
//   last_name       -> lname
//   <part after @>  -> domain
//   <entire record> -> data    (JSONB)
//
// Upserts via the Supabase REST API (PostgREST) with on_conflict=email, so
// re-running only updates existing rows — never duplicates. Reads SUPABASE_URL
// and SUPABASE_KEY (secret) from the repo-root .env. Run leads_schema.sql first.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv() {
  const text = readFileSync(join(repoRoot, ".env"), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}
const { SUPABASE_URL, SUPABASE_KEY } = loadEnv();
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL / SUPABASE_KEY in .env");
  process.exit(1);
}

const file = process.argv[2] || join(repoRoot, "hubspot", "leads.json");
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const ENDPOINT = `${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/leads?on_conflict=email`;
const HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

const raw = JSON.parse(readFileSync(file, "utf8"));
if (!Array.isArray(raw)) {
  console.error("Expected the JSON file to be an array of records.");
  process.exit(1);
}

// Build rows; skip blank/invalid emails; dedupe by email (last occurrence wins).
const byEmail = new Map();
const skipped = [];
for (const rec of raw) {
  const email = String(rec?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    skipped.push(rec?.email ?? "(blank)");
    continue;
  }
  byEmail.set(email, {
    email,
    fname: (rec.first_name ?? "").trim() || null,
    lname: (rec.last_name ?? "").trim() || null,
    domain: email.split("@")[1] || null,
    data: rec,
  });
}
const rows = [...byEmail.values()];
console.log(`Parsed ${rows.length} unique leads (${skipped.length} skipped for bad/blank email).`);

const BATCH = 500;
let upserted = 0;
const failed = [];

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const n = Math.floor(i / BATCH) + 1;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const body = await res.text();
      console.log(`Batch ${n} failed (${res.status}): ${body.slice(0, 300)}`);
      failed.push(...batch.map((r) => ({ email: r.email, reason: `${res.status}` })));
    } else {
      upserted += batch.length;
      console.log(`Batch ${n}: ${batch.length} ok (running: ${upserted} upserted)`);
    }
  } catch (e) {
    console.log(`Batch ${n} threw: ${e.message}`);
    failed.push(...batch.map((r) => ({ email: r.email, reason: e.message })));
  }
}

console.log(`\nDone. upserted=${upserted} failed=${failed.length} skipped=${skipped.length}`);
if (skipped.length) console.log("Skipped emails:", skipped.join(", "));
if (failed.length) {
  console.log("\nFailed:");
  for (const f of failed.slice(0, 50)) console.log(`  ${f.email}  —  ${f.reason}`);
}
