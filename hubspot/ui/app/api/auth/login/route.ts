import { NextRequest, NextResponse } from "next/server";
import { checkCredentials, createSessionToken, COOKIE_NAME, MAX_AGE_SECONDS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const email = (body.email || "").trim();
  const password = body.password || "";

  if (!checkCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await createSessionToken(email.toLowerCase());
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return res;
}
