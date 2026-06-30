import { NextResponse } from "next/server";
import { COOKIE_NAME } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const res = NextResponse.redirect(new URL("/login", `${proto}://${host}`));
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
