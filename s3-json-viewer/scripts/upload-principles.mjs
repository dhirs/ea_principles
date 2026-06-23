#!/usr/bin/env node
/**
 * Upload data/principles.json to S3 (replaces the manual console upload).
 *
 * Usage (from s3-json-viewer/):
 *   npm run push            # validate + upload + bust cache
 *   npm run push -- --dry-run   # validate only, no upload (no AWS call)
 *
 * Credentials + target are read from .env.local via `node --env-file` (see package.json):
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME, S3_JSON_KEY
 * Optional: REFRESH_URL (e.g. http://localhost:3000/api/refresh) to revalidate the live cache.
 *
 * The keys are never read or printed by this script directly — the AWS SDK's default
 * provider chain picks them up from the environment.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ lives in s3-json-viewer/; the catalogue file is at the repo root: ../../data/principles.json
const FILE = resolve(__dirname, "..", "..", "data", "principles.json");
const DRY_RUN = process.argv.includes("--dry-run");

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

// 1. Validate the JSON before doing anything irreversible.
let raw, parsed;
try {
  raw = readFileSync(FILE, "utf8");
} catch (e) {
  fail(`cannot read ${FILE}: ${e.message}`);
}
try {
  parsed = JSON.parse(raw);
} catch (e) {
  fail(`principles.json is not valid JSON — aborting upload. ${e.message}`);
}
const standards = parsed.standards ?? parsed.principles;
if (!Array.isArray(standards) || standards.length === 0) {
  fail("parsed JSON has no non-empty `standards` array — refusing to upload.");
}
const bytes = Buffer.byteLength(raw);
console.log(`✓ valid JSON — ${standards.length} standards, ${(bytes / 1024).toFixed(1)} KB`);

// 2. Check required config.
const { AWS_REGION, S3_BUCKET_NAME, S3_JSON_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;
for (const [k, v] of Object.entries({ AWS_REGION, S3_BUCKET_NAME, S3_JSON_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY })) {
  if (!v) fail(`missing env var ${k} (is .env.local loaded? run via \`npm run push\`)`);
}
console.log(`  target: s3://${S3_BUCKET_NAME}/${S3_JSON_KEY}  (${AWS_REGION})`);

if (DRY_RUN) {
  console.log("✓ dry run — validation passed, no upload performed.");
  process.exit(0);
}

// 3. Upload (dynamic import so --dry-run needs no aws-sdk).
const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
const s3 = new S3Client({ region: AWS_REGION });
try {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: S3_JSON_KEY,
    Body: raw,
    ContentType: "application/json",
    CacheControl: "no-cache",
  }));
  console.log(`✓ uploaded to s3://${S3_BUCKET_NAME}/${S3_JSON_KEY}`);
} catch (e) {
  fail(`S3 upload failed: ${e.name} — ${e.message}`);
}

// 4. Optionally bust the app cache so the live site reflects the new data immediately.
if (process.env.REFRESH_URL) {
  try {
    const r = await fetch(process.env.REFRESH_URL, { method: "POST" });
    console.log(r.ok ? `✓ cache revalidated (${process.env.REFRESH_URL})` : `! refresh returned ${r.status}`);
  } catch (e) {
    console.log(`! cache refresh skipped: ${e.message} (server not running?)`);
  }
} else {
  console.log("  (set REFRESH_URL to auto-bust the cache, or hit Refresh in the app; cache TTL is 60s)");
}
