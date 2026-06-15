# HubSpot — how we push records

How contact records get into our HubSpot account (`datawhistl.com`, account `243427883`).
All scripts live in `hubspot/` and talk to the HubSpot CRM v3 REST API directly with `fetch`.

## Auth
- Every script reads `HUBSPOT_TOKEN` from the repo-root **`.env`** (`/Users/ULTRA7/backup/codebase/ai_principles_server/.env`).
- It is a HubSpot **private-app access token** (`pat-...`) with `contacts.read` / `contacts.write` scope.
- `.env` is gitignored — never commit it. The canonical copy of the token also lives in the
  `maven-webhook-capture` Lambda config (`aws lambda get-function-configuration
  --function-name maven-webhook-capture --region ap-south-1`), per `GATEWAY.md`.
- If `.env` is missing/empty the scripts fail with `ENOENT` — repopulate it before running.

## Core mechanism: upsert by email
Records are **upserted by `email`**, so re-running never creates duplicates:

- Endpoint: `POST https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert`
- Body: `{ inputs: [ { idProperty: "email", id: <email>, properties: {...} }, ... ] }`
- Batches of **100** inputs per request (the API max).
- Each batch is **atomic** — one bad row (e.g. invalid email) 400s the whole batch.
  The script catches that, then retries the batch **row-by-row** so good rows still land
  and only the truly bad ones are reported as failures.

## Bulk sign-up import — `hubspot/import_maven_signups.mjs`
Primary path for importing a list of sign-ups (e.g. `hs.csv`).

```bash
node hubspot/import_maven_signups.mjs <path-to-csv>
```

Input file columns (header row auto-detected and skipped):

```
Name,Email,Date Added,Source
```

Field mapping:

| Source column | HubSpot property |
|---|---|
| `Email` | `email` (upsert key, lowercased) |
| `Name` → first token | `firstname` |
| `Name` → remaining tokens | `lastname` |
| `Source` | `maven_event` |
| `"<Date Added>  <Source>"` | `maven_activity_log` (history line) |
| (constant) | `maven_interest = ai_enterprise_architecture` |
| (constant) | `maven_contact_type = student` |

Behavior:
- Dedupes by lowercased email before sending (last occurrence wins).
- Skips rows whose email fails `^[^@\s]+@[^@\s]+\.[^@\s]+$` and reports them.
- Prints a summary: `created`, `updated`, `failed`, `skipped`, plus the reason for each failure.
- **Idempotent** — fix bad rows in the CSV and re-run; existing contacts are just updated.

### Known limitation
The CSV is split on `,` naively, so **quoted names containing commas**
(e.g. `"Olya Kollen, PMP, PhD"`) misalign and get skipped. Fix by removing the
inner commas in the `Name` column, or pre-clean the CSV, then re-run.

## Other scripts in `hubspot/`
- `list_contacts.mjs` — read-only; paginates all contacts and prints `id / email / name`. Use to verify an import.
- `add_sample_contacts.mjs` — seed a few test contacts.
- `delete_all_contacts.mjs` — **destructive**; wipes contacts. Use only in a throwaway account.
- `import_companies.mjs` / `fix_duplicate_companies.mjs` — company-object import + dedupe (same auth/upsert pattern).

## Verifying an import
```bash
node hubspot/list_contacts.mjs | head
```
Or search in the app: `https://app.hubspot.com/contacts/243427883`.
