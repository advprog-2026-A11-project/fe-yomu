import { NextRequest, NextResponse } from "next/server";
import { AUTH_PRESENCE_COOKIE } from "@/lib/auth-cookies";
import {
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth-cookie-session";

type SessionPayload = {
  accessToken?: string;
  refreshToken?: string;
};

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: request.cookies.has(AUTH_PRESENCE_COOKIE),
  });
}

export async function POST(request: NextRequest) {
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

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
