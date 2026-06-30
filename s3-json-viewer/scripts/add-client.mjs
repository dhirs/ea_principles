#!/usr/bin/env node
// Provision (or update) an approved client in the Supabase `aegis_clients` table.
//
//   npm run add-client -- you@company.com 'TempPass123'
//   npm run add-client -- you@company.com 'TempPass123' --status pending --company "Acme"
//
// Defaults to status=active (i.e. immediately allowed). Run with --status pending
// to stage a client before payment, then flip to active later.
// Re-running for the same email updates the row (resets password/status).

import { scrypt, randomBytes } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const args = process.argv.slice(2);
const positional = [];
const opts = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    opts[args[i].slice(2)] = args[i + 1];
    i++;
  } else {
    positional.push(args[i]);
  }
}

const email = (positional[0] || "").trim().toLowerCase();
const password = positional[1];
const status = opts.status || "active";
const company = opts.company || null;

if (!email || !password) {
  console.error("Usage: npm run add-client -- <email> <password> [--status active|pending|suspended] [--company \"Name\"]");
  process.exit(1);
}
if (!["active", "pending", "suspended"].includes(status)) {
  console.error(`Invalid status "${status}". Use active | pending | suspended.`);
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL / SUPABASE_KEY missing. Run via `npm run add-client` (loads .env.local).");
  process.exit(1);
}

async function hashPassword(pw) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(pw, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const password_hash = await hashPassword(password);

const res = await fetch(`${url}/rest/v1/aegis_clients?on_conflict=email`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=representation",
  },
  body: JSON.stringify([{ email, password_hash, status, company }]),
});

if (!res.ok) {
  console.error(`Failed (${res.status}): ${await res.text()}`);
  process.exit(1);
}

const [row] = await res.json();
console.log(`✓ ${row.email} — status=${row.status}${row.company ? ` (${row.company})` : ""}`);
