// Repair: my import_companies.mjs created duplicate companies (originals were
// auto-created by HubSpot at contact-import time). For each domain in the CSV:
//   - keep the OLDEST company (the original, which holds existing associations)
//   - delete the newer duplicate(s) I created
//   - update the survivor with Apollo metadata (name, numberofemployees)
//   - (re)associate the enriched contact to the survivor (idempotent)
// Usage: node hubspot/fix_duplicate_companies.mjs "enriched - enriched.csv.csv"
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

const FREE = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","aol.com","icloud.com",
  "me.com","mac.com","live.com","duck.com","protonmail.com","ymail.com","comcast.net","fastmail.com",
  "gmx.net","web.de","rediffmail.com","earthlink.net","optonline.net","yahoo.co.in","yahoo.co.uk",
  "outlook.com.au","live.co.uk","gmx.ch","doctor.com"]);

function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i+1] === '"') { field += '"'; i++; } else if (c === '"') q = false; else field += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const file = process.argv[2];
const rows = parseCSV(readFileSync(join(repoRoot, file), "utf8")).filter(r => r.some(c => c.trim()));
const header = rows.shift().map(h => h.trim());
const col = (r, n) => (r[header.indexOf(n)] || "").trim();

const byDomain = new Map();
for (const r of rows) {
  const email = col(r, "email").toLowerCase();
  const domain = email.split("@")[1] || "";
  if (!domain || FREE.has(domain)) continue;
  if (!byDomain.has(domain)) byDomain.set(domain, { name: col(r, "org") || domain, employees: col(r, "employees"), emails: [] });
  byDomain.get(domain).emails.push(email);
}

// Fetch ALL companies -> domain -> [{id, createdate}]
const domainCos = new Map();
let after;
do {
  const u = new URL("https://api.hubapi.com/crm/v3/objects/companies");
  u.searchParams.set("limit", "100"); u.searchParams.set("properties", "domain,createdate");
  if (after) u.searchParams.set("after", after);
  const b = await (await fetch(u, { headers: auth })).json();
  for (const c of b.results) {
    const d = c.properties.domain; if (!d) continue;
    if (!domainCos.has(d)) domainCos.set(d, []);
    domainCos.get(d).push({ id: c.id, createdate: c.properties.createdate });
  }
  after = b.paging?.next?.after;
} while (after);

const deleteIds = [];
const updates = [];
const survivors = new Map(); // domain -> survivor id
for (const [domain, meta] of byDomain) {
  const cos = (domainCos.get(domain) || []).sort((a, b) => a.createdate.localeCompare(b.createdate));
  if (!cos.length) continue;
  const survivor = cos[0].id;          // oldest = original
  survivors.set(domain, survivor);
  for (const c of cos.slice(1)) deleteIds.push(c.id); // newer dupes = mine
  const props = { name: meta.name };
  const n = parseInt(meta.employees, 10);
  if (Number.isFinite(n)) props.numberofemployees = String(n);
  updates.push({ id: survivor, properties: props });
}

console.log(`Survivors: ${survivors.size} | duplicates to delete: ${deleteIds.length}`);

// 1. Delete my duplicates (archive).
for (let i = 0; i < deleteIds.length; i += 100) {
  const batch = deleteIds.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/companies/batch/archive", {
    method: "POST", headers: auth, body: JSON.stringify({ inputs: batch.map(id => ({ id })) }),
  });
  console.log(`Delete batch ${i/100+1}: ${res.status === 204 ? "ok" : res.status}`);
}

// 2. Update survivors with Apollo metadata.
for (let i = 0; i < updates.length; i += 100) {
  const batch = updates.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/companies/batch/update", {
    method: "POST", headers: auth, body: JSON.stringify({ inputs: batch }),
  });
  console.log(`Update batch ${i/100+1}: ${res.ok ? "ok" : res.status + " " + (await res.text()).slice(0,150)}`);
}

// 3. Resolve enriched contacts and (re)associate to survivors (idempotent).
const allEmails = [...new Set([...byDomain.values()].flatMap(v => v.emails))];
const emailToContact = new Map();
for (let i = 0; i < allEmails.length; i += 100) {
  const batch = allEmails.slice(i, i + 100);
  const b = await (await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/read", {
    method: "POST", headers: auth,
    body: JSON.stringify({ idProperty: "email", properties: ["email"], inputs: batch.map(id => ({ id })) }),
  })).json();
  for (const c of b.results ?? []) emailToContact.set(c.properties.email.toLowerCase(), c.id);
}
const assoc = [];
for (const [domain, meta] of byDomain) {
  const cid = survivors.get(domain); if (!cid) continue;
  for (const e of meta.emails) { const k = emailToContact.get(e); if (k) assoc.push({ from: { id: k }, to: { id: cid } }); }
}
let associated = 0;
for (let i = 0; i < assoc.length; i += 100) {
  const batch = assoc.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v4/associations/contacts/companies/batch/associate/default", {
    method: "POST", headers: auth, body: JSON.stringify({ inputs: batch }),
  });
  if (res.ok) associated += batch.length; else console.error(`assoc ${res.status}: ${(await res.text()).slice(0,150)}`);
}
console.log(`Re-associated ${associated} contact↔company pairs.`);
