import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth-cookies";
const PROTECTED_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/users/account",
  "/reading",
  "/forums",
  "/achievement",
  "/clan",
];

const PROTECTED_API_PREFIXES = [
  "/api/achievement",
  "/api/clan",
  "/api/messages",
  "/api/reading-admin",
  "/api/reading-student",
];

function isProtectedPath(pathname: string): boolean {
  const protectedPrefixes = pathname.startsWith("/api/")
    ? PROTECTED_API_PREFIXES
    : PROTECTED_PATH_PREFIXES;

  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  if (authCookie) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/users";
  redirectUrl.searchParams.set("mode", "login");
  redirectUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/users/account/:path*",
    "/reading/:path*",
    "/forums/:path*",
    "/achievement/:path*",
    "/clan/:path*",
    "/api/achievement/:path*",
    "/api/clan/:path*",
    "/api/messages/:path*",
    "/api/reading-admin/:path*",
    "/api/reading-student/:path*",
  ],
};
