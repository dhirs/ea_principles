// Stateless signed-session token. Uses the Web Crypto API only (no node:crypto),
// so it runs in BOTH the Edge middleware and Node route handlers.
// Token shape: base64url(JSON payload) + "." + base64url(HMAC-SHA256 of the payload).

export const COOKIE_NAME = "aegis_session";
export const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

type SessionPayload = { email: string; exp: number };

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmac(data: string): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionToken(email: string): Promise<string> {
  const payload: SessionPayload = {
    email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = toBase64Url(await hmac(body));
  return `${body}.${sig}`;
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const expected = await hmac(body);
    if (!timingSafeEqual(fromBase64Url(sig), expected)) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload;
    if (!payload.email || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
