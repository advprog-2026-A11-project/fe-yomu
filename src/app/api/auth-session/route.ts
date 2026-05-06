import { NextRequest, NextResponse } from "next/server";
import {
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth-cookie-session";

type SessionPayload = {
  accessToken?: string;
  refreshToken?: string;
};

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
