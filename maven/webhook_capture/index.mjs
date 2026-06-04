// Maven webhook -> HubSpot contact upsert.
// Receives a Maven webhook, maps fields, and upserts a HubSpot contact by email.
// HUBSPOT_TOKEN is provided as a Lambda environment variable.

const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN;
// Shared secret: Maven must include ?token=<WEBHOOK_SECRET> in the webhook URL.
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
// Custom lifecycle stage "Maven_Course" (internal value). Set on the contact so
// HubSpot's lifecycle-stage sync propagates it to the auto-created company.
const MAVEN_COURSE_STAGE = "3786734329";

// Split "First Middle Last" -> { firstname, lastname }
function splitName(name) {
  if (!name || typeof name !== "string") return { firstname: undefined, lastname: undefined };
  const parts = name.trim().split(/\s+/);
  return { firstname: parts[0], lastname: parts.slice(1).join(" ") || undefined };
}

// Fetch a contact's current activity log by email. Returns "" if contact/log absent.
async function fetchActivityLog(email) {
  const url = `https://api.hubapi.com/crm/v3/objects/contacts/${encodeURIComponent(email)}?idProperty=email&properties=maven_activity_log`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${HUBSPOT_TOKEN}` } });
  if (res.status === 404) return "";
  if (!res.ok) {
    console.warn(`Could not read existing log (${res.status}); starting fresh.`);
    return "";
  }
  const body = await res.json().catch(() => ({}));
  return body?.properties?.maven_activity_log || "";
}

async function upsertContact(properties) {
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts/batch/upsert", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HUBSPOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: [{ idProperty: "email", id: properties.email, properties }],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HubSpot ${res.status}: ${JSON.stringify(body)}`);
  return body.results?.[0];
}

export const handler = async (event) => {
  // Reject anything that doesn't present the shared secret.
  const token = event?.queryStringParameters?.token;
  if (WEBHOOK_SECRET && token !== WEBHOOK_SECRET) {
    console.warn("Rejected request: missing/invalid token");
    return { statusCode: 401, body: JSON.stringify({ error: "unauthorized" }) };
  }

  const { body, isBase64Encoded } = event;
  const raw = isBase64Encoded && body ? Buffer.from(body, "base64").toString("utf8") : body;

  let payload;
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    console.error("Body is not valid JSON:", raw);
    return { statusCode: 400, body: JSON.stringify({ error: "invalid JSON" }) };
  }

  console.log("Maven event:", JSON.stringify(payload));

  const email = payload?.user?.email;
  if (!email) {
    // Nothing to upsert without an email key. Ack so Maven doesn't retry.
    console.log("No user.email in payload — skipping HubSpot write.");
    return { statusCode: 200, body: JSON.stringify({ received: true, skipped: "no email" }) };
  }

  const { firstname, lastname } = splitName(payload?.user?.name);

  // Build the new activity-log entry and prepend it to the existing history.
  const ts = new Date().toISOString();
  const amt = payload?.payment?.amount_total;
  const entry = [
    ts,
    payload?.event ?? "unknown",
    amt != null ? `$${amt}` : "",
    payload?.cohort ? `cohort=${payload.cohort}` : "",
  ]
    .filter(Boolean)
    .join("  ");

  const existingLog = await fetchActivityLog(email);
  const maven_activity_log = existingLog ? `${entry}\n${existingLog}` : entry;

  // Map Maven -> HubSpot. Drop undefined keys so we never clobber with blanks.
  const properties = Object.fromEntries(
    Object.entries({
      email,
      firstname,
      lastname,
      maven_event: payload?.event,
      maven_course: payload?.course,
      maven_interest: payload?.course, // interest mirrors the course
      maven_cohort: payload?.cohort,
      maven_amt: amt,
      maven_contact_type: "student", // always "student" for this integration
      lifecyclestage: MAVEN_COURSE_STAGE, // company inherits this via lifecycle sync
      maven_activity_log,
    }).filter(([, v]) => v !== undefined && v !== null)
  );

  try {
    const result = await upsertContact(properties);
    console.log(`Upserted contact ${result?.id} (${email})`);
    return { statusCode: 200, body: JSON.stringify({ received: true, contactId: result?.id }) };
  } catch (err) {
    console.error("HubSpot upsert failed:", err.message);
    // Still 200 so Maven doesn't hammer retries; we have the payload logged for replay.
    return { statusCode: 200, body: JSON.stringify({ received: true, hubspotError: err.message }) };
  }
};
