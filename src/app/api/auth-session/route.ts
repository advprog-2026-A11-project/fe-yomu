import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_PRESENCE_COOKIE,
  AUTH_REFRESH_COOKIE,
} from "@/lib/auth-cookies";

type SessionPayload = {
  accessToken?: string;
  refreshToken?: string;
};

function secureCookieEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

function setCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
): void {
  response.cookies.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieEnabled(),
    path: "/",
    maxAge,
  });
}

function clearCookie(response: NextResponse, name: string): void {
  response.cookies.set(name, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieEnabled(),
    path: "/",
    maxAge: 0,
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
  setCookie(response, AUTH_ACCESS_COOKIE, payload.accessToken, 60 * 60);
  setCookie(response, AUTH_PRESENCE_COOKIE, "1", 60 * 60 * 24 * 30);

  if (payload.refreshToken) {
    setCookie(response, AUTH_REFRESH_COOKIE, payload.refreshToken, 60 * 60 * 24 * 30);
  }

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearCookie(response, AUTH_ACCESS_COOKIE);
  clearCookie(response, AUTH_REFRESH_COOKIE);
  clearCookie(response, AUTH_PRESENCE_COOKIE);
  return response;
}
