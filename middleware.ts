import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_KEY = "yomu-auth";
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/users/account",
  "/reading",
  "/forums",
  "/achievement",
  "/clan",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_KEY)?.value;
  if (authCookie) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/users";
  redirectUrl.searchParams.set("mode", "login");
  redirectUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users/account/:path*",
    "/reading/:path*",
    "/forums/:path*",
    "/achievement/:path*",
    "/clan/:path*",
  ],
};
