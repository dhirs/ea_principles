import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth";

// Everything is gated except the login page and the auth endpoints.
// Static assets are excluded via `matcher`.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Auth endpoints must stay open so users can actually log in / out.
  if (pathname.startsWith("/api/auth")) return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico|css|js|woff2?)$).*)",
  ],
};
