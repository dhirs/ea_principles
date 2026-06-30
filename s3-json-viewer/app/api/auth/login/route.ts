import { NextResponse } from "next/server";
import { getClientByEmail, touchLastLogin } from "@/lib/auth/clients";
import { verifyPassword } from "@/lib/auth/password";
import {
  COOKIE_NAME,
  MAX_AGE_SECONDS,
  createSessionToken,
} from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let email: string, password: string;
  try {
    const body = await req.json();
    email = String(body.email ?? "").trim().toLowerCase();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  let client;
  try {
    client = await getClientByEmail(email);
  } catch {
    return NextResponse.json(
      { error: "Service unavailable. Please try again." },
      { status: 503 }
    );
  }

  // Generic message for not-found / bad-password so we don't reveal which emails exist.
  const INVALID = "Incorrect email or password.";
  if (!client) {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }

  if (client.status !== "active") {
    const msg =
      client.status === "suspended"
        ? "This account has been suspended. Contact support."
        : "This account is not yet active. Access is enabled once your subscription is confirmed.";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const ok = await verifyPassword(password, client.password_hash);
  if (!ok) {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }

  const token = await createSessionToken(client.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  void touchLastLogin(client.email);
  return res;
}
