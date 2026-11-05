import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, homeFor, verifyToken, type Role } from "@/lib/auth/jwt";

// First line of defence only. Every route handler and layout re-checks against the database.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const required: Role = pathname.startsWith("/faculty") || pathname.startsWith("/api/faculty") ? "FACULTY" : "STUDENT";
  const isApi = pathname.startsWith("/api/");

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Sign in to continue" }, { status: 401 });
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (session.role !== required) {
    if (isApi) return NextResponse.json({ error: "You don't have access to this" }, { status: 403 });
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/faculty/:path*", "/student/:path*", "/api/faculty/:path*", "/api/student/:path*"],
};
