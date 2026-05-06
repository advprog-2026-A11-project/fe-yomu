import { NextResponse } from "next/server";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_PRESENCE_COOKIE,
  AUTH_REFRESH_COOKIE,
} from "@/lib/auth-cookies";

export type AuthCookiePayload = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
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

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
): void {
  setCookie(response, AUTH_ACCESS_COOKIE, accessToken, 60 * 60);
  setCookie(response, AUTH_PRESENCE_COOKIE, "1", 60 * 60 * 24 * 30);

  if (refreshToken) {
    setCookie(response, AUTH_REFRESH_COOKIE, refreshToken, 60 * 60 * 24 * 30);
  }
}

export function clearAuthCookies(response: NextResponse): void {
  setCookie(response, AUTH_ACCESS_COOKIE, "", 0);
  setCookie(response, AUTH_REFRESH_COOKIE, "", 0);
  setCookie(response, AUTH_PRESENCE_COOKIE, "", 0);
}

export function applyAuthCookiesFromPayload(
  response: NextResponse,
  payload: AuthCookiePayload,
): void {
  const accessToken = payload.accessToken || payload.access_token;
  const refreshToken = payload.refreshToken || payload.refresh_token;
  if (accessToken) {
    setAuthCookies(response, accessToken, refreshToken);
  }
}
