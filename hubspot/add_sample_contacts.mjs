// Standalone test: create a couple of sample contacts in HubSpot.
// Usage (from repo root): node hubspot/add_sample_contacts.mjs
// Reads HUBSPOT_TOKEN from the repo-root .env. No extra deps (Node 18+ global fetch).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Minimal .env loader — just enough to grab HUBSPOT_TOKEN.
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
if (!HUBSPOT_TOKEN) {
  console.error("HUBSPOT_TOKEN not found in .env");
  process.exit(1);
}

// Sample contacts to upsert (by email, so re-running won't duplicate).
const contacts = [
  { email: "ada.lovelace@example.com", firstname: "Ada", lastname: "Lovelace", company: "Analytical Engines" },
  { email: "alan.turing@example.com", firstname: "Alan", lastname: "Turing", company: "Bletchley Park" },
];

// Batch upsert by email: creates if new, updates if the email already exists.
async function upsertAll(list) {
  const inputs = list.map(({ email, ...properties }) => ({
    idProperty: "email",
    id: email,
    properties: { email, ...properties },
  }));

  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${JSON.stringify(body)}`);
  }
  return body.results ?? [];
}

try {
  const results = await upsertAll(contacts);
  for (const r of results) {
    console.log(`✓ ${r.properties?.email} → id ${r.id} (${r.new ? "created" : "updated"})`);
  }
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exitCode = 1;
}
