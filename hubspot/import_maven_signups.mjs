// Bulk-import Maven sign-ups into HubSpot.
// Usage: node hubspot/import_maven_signups.mjs <path-to-tsv>
//
// Expected file: tab-separated, one row per contact, columns in this order:
//   Name <TAB> Email <TAB> Date Added <TAB> Source
// A header row ("Name  Email  Date Added  Source") is auto-detected and skipped.
// Rows with a blank Name are fine (firstname/lastname just won't be set).
//
// Behavior: upsert by email (no duplicates), batches of 100. Maps:
//   Name   -> firstname / lastname
//   Source -> maven_event
//   "<Date Added>  <Source>" -> maven_activity_log (signup history line)
// Invalid/blank emails are skipped and reported. Reads HUBSPOT_TOKEN from .env.

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
const { HUBSPOT_TOKEN } = loadEnv();

const file = process.argv[2];
if (!file) {
  console.error("Usage: node hubspot/import_maven_signups.mjs <path-to-tsv>");
  process.exit(1);
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function splitName(name) {
  const n = (name || "").trim();
  if (!n) return {};
  const parts = n.split(/\s+/);
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") || undefined };
}

// Parse the TSV into upsert inputs, deduping by lowercased email.
const lines = readFileSync(file, "utf8").split("\n");
const byEmail = new Map();
const skipped = [];

for (const line of lines) {
  if (!line.trim()) continue;
  const cols = line.split(",").map((c) => c.trim());
  // Skip a header row.
  if (cols[1] && cols[1].toLowerCase() === "email") continue;

  const [name, emailRaw, dateAdded, source] = cols;
  const email = (emailRaw || "").toLowerCase();
  if (!EMAIL_RE.test(email)) {
    skipped.push(emailRaw || "(blank)");
    continue;
  }

  const logLine = [dateAdded, source].filter(Boolean).join("  ");
  const properties = Object.fromEntries(
    Object.entries({
      email,
      ...splitName(name),
      maven_event: source || undefined,
      maven_activity_log: logLine || undefined,
      maven_interest: "ai_enterprise_architecture",
      maven_contact_type: "student",
    }).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );
  // Last occurrence wins on duplicate email.
  byEmail.set(email, { idProperty: "email", id: email, properties });
}

const inputs = [...byEmail.values()];
console.log(`Parsed ${inputs.length} unique contacts (${skipped.length} skipped for bad/blank email).`);
if (skipped.length) console.log("Skipped:", skipped.join(", "));

async function upsertBatch(batch) {
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert", {
    method: "POST",
    headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: batch }),
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

let created = 0, updated = 0;
const failures = [];

for (let i = 0; i < inputs.length; i += 100) {
  const batch = inputs.slice(i, i + 100);
  const r = await upsertBatch(batch);
  if (r.ok) {
    for (const x of r.body.results ?? []) (x.new ? created++ : updated++);
    console.log(`Batch ${i / 100 + 1}: ${batch.length} ok (running: ${created} created, ${updated} updated)`);
    continue;
  }
  // Batch is atomic — one bad row fails all 100. Retry each row individually.
  console.warn(`Batch ${i / 100 + 1} failed (${r.status}); retrying row-by-row...`);
  for (const input of batch) {
    const one = await upsertBatch([input]);
    if (one.ok) {
      for (const x of one.body.results ?? []) (x.new ? created++ : updated++);
    } else {
      const msg = one.body?.message || JSON.stringify(one.body).slice(0, 120);
      failures.push({ email: input.id, reason: msg });
    }
  }
  console.log(`Batch ${i / 100 + 1}: recovered individually (running: ${created} created, ${updated} updated)`);
}

console.log(`\nDone. created=${created} updated=${updated} failed=${failures.length} skipped=${skipped.length}`);
if (failures.length) {
  console.log("\nFailed contacts (fix and re-run — import is idempotent):");
  for (const f of failures) console.log(`  ${f.email}  —  ${f.reason}`);
}
