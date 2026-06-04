# GATEWAY.md — Maven → HubSpot Webhook Integration

Receives Maven webhook events and upserts a contact into HubSpot, preserving a
per-contact activity history. Runs entirely on AWS free-tier resources in the
existing account.

## Flow

```
Maven  ──POST (event JSON)──►  API Gateway (HTTP API)  ──►  Lambda  ──►  HubSpot CRM API
            ?token=<secret>         "maven-webhook"      maven-webhook-capture   (upsert contact by email)
```

1. Maven POSTs an event to the API Gateway URL (with a shared secret in the query string).
2. The Lambda verifies the `?token=` secret, parses the payload, and maps fields.
3. It reads the contact's existing activity log, prepends the new event, and **upserts**
   the contact in HubSpot by email (creates if new, updates if existing — never duplicates).

## AWS resources (account `863372932275`, region `ap-south-1`)

| Resource | Name / ID | Notes |
|---|---|---|
| HTTP API Gateway | `maven-webhook` (ApiId `okddc6yb80`) | Quick-create `$default` route → Lambda proxy |
| Lambda | `maven-webhook-capture` | Node.js 20.x, handler `index.handler` |
| Execution role | `lambda-execution-role` | **Reused** existing shared role (no new IAM created) |
| Log group | `/aws/lambda/maven-webhook-capture` | CloudWatch — full payloads logged |

### Webhook URL (paste into Maven)

```
https://okddc6yb80.execute-api.ap-south-1.amazonaws.com/?token=<WEBHOOK_SECRET>
```

The `?token=` value **must** match the Lambda's `WEBHOOK_SECRET` env var, or requests
are rejected with `401`. Treat the full URL as a secret — anyone with it can write contacts.

### Lambda environment variables

| Var | Purpose |
|---|---|
| `HUBSPOT_TOKEN` | HubSpot private-app access token (`pat-...`), `contacts.read/write` scope |
| `WEBHOOK_SECRET` | Shared secret Maven must include as `?token=` |

> The literal secret values live only in the Lambda config (`aws lambda get-function-configuration`),
> not in this repo. Do not commit them.

## HubSpot side

- **Auth:** private app token (`HUBSPOT_TOKEN`). Free tier.
- **Object written:** Contact, **upserted by `email`**.
- **Properties set per event:**

  | Maven field | HubSpot property | Type |
  |---|---|---|
  | `user.email` | `email` | standard (upsert key) |
  | `user.name` → first token | `firstname` | standard |
  | `user.name` → rest | `lastname` | standard |
  | `event` | `maven_event` | custom (latest snapshot) |
  | `course` | `maven_course` | custom |
  | `cohort` | `maven_cohort` | custom |
  | `payment.amount_total` | `maven_amt` | custom |
  | `course` (mirrored) | `maven_interest` | custom — set equal to the course |
  | (constant) | `maven_contact_type` | custom — always `student` |
  | (composed) | `maven_activity_log` | custom, multi-line text — full history |

- `maven_activity_log` accumulates one line per event (newest first), e.g.:

  ```
  2026-06-04T11:23:51.224Z  payment.success       $500  cohort=jun-2026
  2026-06-04T11:23:44.875Z  application.received  $500  cohort=jun-2026
  ```

## Maven event payload shape

```json
{
  "event": "application.received",        // also seen: "payment.success"
  "course": "test-course-slug",
  "cohort": "test-cohort-slug",
  "user": { "email": "...", "name": "First Last", "preferred_name": null },
  "payment": { "amount_total": "500" }
}
```

- Maven sends **no signature header** — request authenticity relies on the `?token=` secret.
- The Lambda acts on any event that has a `user.email`.

## Known constraints (why it's built this way)

- **Notes API** (`crm.objects.notes.write`) is **not grantable** on this Free-tier private app —
  so timeline Notes were not an option.
- **Timeline Events API** rejects private-app tokens (`401 "Malformed OAuth access token"`); it
  only works for public apps in a HubSpot developer account. Adding the `timeline` scope did not help.
- Therefore activity history is stored in the `maven_activity_log` **contact property**
  (read-prepend-write), which works with the `contacts.write` scope already held.
- Each event makes 2 HubSpot calls (read log → upsert). Fine within Free-tier rate limits.

## Source & helper scripts

| Path | Purpose |
|---|---|
| `maven/webhook_capture/index.mjs` | Lambda handler (guard → map → read log → upsert) |
| `hubspot/add_sample_contacts.mjs` | Create/upsert sample contacts |
| `hubspot/list_contacts.mjs` | List all contacts (read-only) |
| `hubspot/delete_all_contacts.mjs` | Archive ALL contacts (destructive) |
| `hubspot/import_maven_signups.mjs` | Bulk-import sign-ups from a CSV (upsert by email, row-by-row retry); sets `maven_interest=ai_enterprise_architecture`, `maven_contact_type=student` |

> **PII:** the sign-up source lists (e.g. `sd.csv`) and `hubspot/import_data_platform_signups.mjs`
> (which embeds real emails) contain personal data and are **gitignored** — kept out of the repo.

All scripts read `HUBSPOT_TOKEN` from the repo-root `.env` and use Node's built-in `fetch`
(no dependencies).

## Operations

### Watch incoming events live
```bash
set -a; source .env; set +a
aws logs tail /aws/lambda/maven-webhook-capture --since 10m --follow --format short
```

### Redeploy the Lambda after editing `index.mjs`
```bash
cd maven/webhook_capture
zip -q -j function.zip index.mjs
set -a; source ../../.env; set +a
aws lambda update-function-code --function-name maven-webhook-capture --zip-file fileb://function.zip
aws lambda wait function-updated --function-name maven-webhook-capture
```

### Update an env var (e.g. rotate the secret)
`update-function-configuration --environment` **replaces all** vars, so always include both:
```bash
aws lambda update-function-configuration --function-name maven-webhook-capture \
  --environment 'Variables={HUBSPOT_TOKEN=...,WEBHOOK_SECRET=...}'
```
If the shell mangles the token, write the JSON to a file and pass `--environment file://env.json`.

### Common log signals
- `Rejected request: missing/invalid token` → caller lacks the correct `?token=` (or Maven URL is missing it).
- `Upserted contact <id> (<email>)` → success.
- `HubSpot upsert failed: ...` → write error; the event is still in the log for replay (Lambda returns 200 to avoid Maven retries).
