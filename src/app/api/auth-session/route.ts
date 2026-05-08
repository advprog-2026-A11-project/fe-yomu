import { NextRequest, NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth-cookies";
import {
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth-cookie-session";
import { verifyTrustedOrigin } from "@/lib/csrf";

type SessionPayload = {
  accessToken?: string;
  refreshToken?: string;
};

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: request.cookies.has(AUTH_ACCESS_COOKIE),
  });
}

export async function POST(request: NextRequest) {
  const csrfViolation = verifyTrustedOrigin(request);
  if (csrfViolation) {
    return csrfViolation;
  }

  const payload = (await request.json()) as SessionPayload;
  if (!payload.accessToken) {
    return NextResponse.json(
      { error: "Missing access token" },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, payload.accessToken, payload.refreshToken);
  return response;
}

export async function DELETE(request: NextRequest) {
  const csrfViolation = verifyTrustedOrigin(request);
  if (csrfViolation) {
    return csrfViolation;
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
