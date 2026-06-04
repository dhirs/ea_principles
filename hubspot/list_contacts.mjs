// List contacts in HubSpot (read-only). Usage: node hubspot/list_contacts.mjs
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

let after, all = [];
do {
  const url = new URL("https://api.hubapi.com/crm/v3/objects/contacts");
  url.searchParams.set("limit", "100");
  url.searchParams.set("properties", "email,firstname,lastname");
  if (after) url.searchParams.set("after", after);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` } });
  const body = await res.json();
  if (!res.ok) { console.error(JSON.stringify(body)); process.exit(1); }
  all.push(...body.results);
  after = body.paging?.next?.after;
} while (after);

console.log(`Total contacts: ${all.length}`);
for (const c of all) {
  console.log(`  ${c.id}  ${c.properties.email ?? "(no email)"}  ${c.properties.firstname ?? ""} ${c.properties.lastname ?? ""}`);
}
