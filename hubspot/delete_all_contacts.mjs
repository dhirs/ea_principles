// Delete (archive) ALL contacts in HubSpot. Usage: node hubspot/delete_all_contacts.mjs
// Archives send records to HubSpot's recycle bin. Batch limit 100/request.
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
const auth = { Authorization: `Bearer ${HUBSPOT_TOKEN}`, "Content-Type": "application/json" };

// 1. Collect every contact id.
let after, ids = [];
do {
  const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
  url.searchParams.set("limit", "100");
  if (after) url.searchParams.set("after", after);
  const res = await fetch(url, { headers: auth });
  const body = await res.json();
  if (!res.ok) { console.error(JSON.stringify(body)); process.exit(1); }
  ids.push(...body.results.map((c) => c.id));
  after = body.paging?.next?.after;
} while (after);

console.log(`Found ${ids.length} contacts to delete.`);

// 2. Archive in batches of 100.
for (let i = 0; i < ids.length; i += 100) {
  const batch = ids.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/archive", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ inputs: batch.map((id) => ({ id })) }),
  });
  if (!res.ok) {
    console.error(`Batch ${i / 100 + 1} failed: ${res.status} ${await res.text()}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ Deleted ${batch.length} contacts (batch ${i / 100 + 1})`);
  }
}
