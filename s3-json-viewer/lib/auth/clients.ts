// Server-side access to the Supabase `aegis_clients` table via the PostgREST
// URL using the service-role key (SUPABASE_KEY). Node runtime only.

export type AegisClient = {
  email: string;
  password_hash: string;
  status: "pending" | "active" | "suspended";
};

function env() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_KEY not set");
  return { url, key };
}

export async function getClientByEmail(
  email: string
): Promise<AegisClient | null> {
  const { url, key } = env();
  const res = await fetch(
    `${url}/rest/v1/aegis_clients?email=eq.${encodeURIComponent(
      email
    )}&select=email,password_hash,status&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`Supabase lookup failed: ${res.status}`);
  const rows = (await res.json()) as AegisClient[];
  return rows[0] ?? null;
}

export async function touchLastLogin(email: string): Promise<void> {
  const { url, key } = env();
  await fetch(
    `${url}/rest/v1/aegis_clients?email=eq.${encodeURIComponent(email)}`,
    {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ last_login_at: new Date().toISOString() }),
    }
  ).catch(() => {});
}
