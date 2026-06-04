// Create Company records from the Apollo-enriched CSV and associate them to
// existing contacts (by email). Company-level fields only: org/employees + domain.
// Skips free-email rows (can't map to a real company). Usage:
//   node hubspot/import_companies.mjs "enriched - enriched.csv.csv"
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

// Minimal RFC-ish CSV parser (handles quoted fields with embedded commas).
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
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
const idx = (n) => header.indexOf(n);

// Dedupe by domain. Each domain -> {name, employees, emails:[]}
const byDomain = new Map();
let skippedFree = 0;
for (const r of rows) {
  const email = (r[idx("email")] || "").trim().toLowerCase();
  const domain = email.split("@")[1] || "";
  if (!domain || FREE.has(domain)) { skippedFree++; continue; }
  const org = (r[idx("org")] || "").trim();
  const employees = (r[idx("employees")] || "").trim();
  if (!byDomain.has(domain)) byDomain.set(domain, { name: org || domain, employees, emails: [] });
  const d = byDomain.get(domain);
  if (!d.name && org) d.name = org;
  if (!d.employees && employees) d.employees = employees;
  d.emails.push(email);
}
const domains = [...byDomain.keys()];
console.log(`${domains.length} companies to create (${skippedFree} free-email rows skipped).`);

// 1. Create companies (batch). Domains here are all new in this account.
const companyInputs = domains.map((domain) => {
  const d = byDomain.get(domain);
  const props = { name: d.name, domain };
  const n = parseInt(d.employees, 10);
  if (Number.isFinite(n)) props.numberofemployees = String(n);
  return { properties: props };
});
const domainToCompanyId = new Map();
for (let i = 0; i < companyInputs.length; i += 100) {
  const batch = companyInputs.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/companies/batch/create", {
    method: "POST", headers: auth, body: JSON.stringify({ inputs: batch }),
  });
  const body = await res.json();
  if (!res.ok) { console.error(`Company create failed (${res.status}): ${JSON.stringify(body).slice(0,300)}`); process.exit(1); }
  for (const c of body.results) domainToCompanyId.set(c.properties.domain, c.id);
}
console.log(`Created ${domainToCompanyId.size} companies.`);

// 2. Resolve contact ids by email (batch read).
const allEmails = [...new Set(domains.flatMap(d => byDomain.get(d).emails))];
const emailToContactId = new Map();
for (let i = 0; i < allEmails.length; i += 100) {
  const batch = allEmails.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/read", {
    method: "POST", headers: auth,
    body: JSON.stringify({ idProperty: "email", properties: ["email"], inputs: batch.map(id => ({ id })) }),
  });
  const body = await res.json();
  for (const c of body.results ?? []) emailToContactId.set(c.properties.email.toLowerCase(), c.id);
}

// 3. Associate each contact to its company (default association, batch v4).
const assocInputs = [];
for (const domain of domains) {
  const companyId = domainToCompanyId.get(domain);
  for (const email of byDomain.get(domain).emails) {
    const contactId = emailToContactId.get(email);
    if (companyId && contactId) assocInputs.push({ from: { id: contactId }, to: { id: companyId } });
  }
}
let associated = 0;
for (let i = 0; i < assocInputs.length; i += 100) {
  const batch = assocInputs.slice(i, i + 100);
  const res = await fetch("https://api.hubapi.com/crm/v4/associations/contacts/companies/batch/associate/default", {
    method: "POST", headers: auth, body: JSON.stringify({ inputs: batch }),
  });
  if (res.ok) associated += batch.length;
  else console.error(`Assoc batch failed (${res.status}): ${(await res.text()).slice(0,200)}`);
}
console.log(`Associated ${associated} contacts to companies (of ${assocInputs.length} pairs; ${allEmails.length - emailToContactId.size} contacts not found).`);
