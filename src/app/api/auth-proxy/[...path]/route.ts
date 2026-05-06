import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_ACCESS_COOKIE,
  AUTH_PRESENCE_COOKIE,
  AUTH_REFRESH_COOKIE,
} from "@/lib/auth-cookies";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type AuthTokenPayload = {
  accessToken?: string;
  access_token?: string;
  refreshToken?: string;
  refresh_token?: string;
};

function resolveTargetBase(): string | null {
  const configured = process.env.BACKEND_AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!configured) {
    return null;
  }

  const normalized = configured.replace(/\/$/, "");
  if (normalized.startsWith("http://localhost:")) {
    return normalized.replace("http://localhost:", "http://127.0.0.1:");
  }

  return normalized;
}

function secureCookieEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
): void {
  response.cookies.set(AUTH_ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieEnabled(),
    path: "/",
    maxAge: 60 * 60,
  });
  response.cookies.set(AUTH_PRESENCE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieEnabled(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  if (refreshToken) {
    response.cookies.set(AUTH_REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookieEnabled(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

function clearAuthCookies(response: NextResponse): void {
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: secureCookieEnabled(),
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(AUTH_ACCESS_COOKIE, "", options);
  response.cookies.set(AUTH_REFRESH_COOKIE, "", options);
  response.cookies.set(AUTH_PRESENCE_COOKIE, "", options);
}

async function injectRefreshTokenIfNeeded(
  bodyText: string,
  request: NextRequest,
  joinedPath: string,
): Promise<string> {
  if (joinedPath !== "auth/refresh") {
    return bodyText;
  }

  const refreshToken = request.cookies.get(AUTH_REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return bodyText;
  }

  let payload: Record<string, unknown> = {};
  if (bodyText.trim()) {
    try {
      payload = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (payload.refreshToken) {
    return bodyText;
  }

  return JSON.stringify({
    ...payload,
    refreshToken,
  });
}

function applyAuthCookiesFromPayload(
  response: NextResponse,
  joinedPath: string,
  upstreamOk: boolean,
  payload: string,
): void {
  if (!upstreamOk || !["auth/login", "auth/register", "auth/refresh"].includes(joinedPath)) {
    return;
  }

  try {
    const parsed = JSON.parse(payload) as AuthTokenPayload;
    const accessToken = parsed.accessToken || parsed.access_token;
    const refreshToken = parsed.refreshToken || parsed.refresh_token;
    if (accessToken) {
      setAuthCookies(response, accessToken, refreshToken);
    }
  } catch {
    // Keep upstream payload untouched if it is not JSON.
  }
}

function shouldLogUpstreamFailure(joinedPath: string, status: number): boolean {
  if (status >= 500) {
    return true;
  }

  if (status !== 401) {
    return false;
  }

  return !["auth/login", "auth/me", "auth/refresh"].includes(joinedPath);
}

async function forward(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const base = resolveTargetBase();
  if (!base) {
    return NextResponse.json(
      { error: "Missing BACKEND_AUTH_API_URL (or NEXT_PUBLIC_AUTH_API_URL) on server" },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const joinedPath = path.join("/");
  const upstreamUrl = new URL(`${base}/${joinedPath}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const headers = new Headers();
  const requestContentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (requestContentType) {
    headers.set("content-type", requestContentType);
  }
  if (accept) {
    headers.set("accept", accept);
  }

  const accessToken = request.cookies.get(AUTH_ACCESS_COOKIE)?.value;
  if (!headers.has("authorization") && accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyText = await request.text();
    init.body = await injectRefreshTokenIfNeeded(bodyText, request, joinedPath);
  }

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl.toString(), init);
  } catch (error) {
    console.error("Auth proxy fetch failed:", error);
    return NextResponse.json(
      {
        error: "Auth service is unavailable",
        detail: process.env.NODE_ENV === "development"
          ? String(error)
          : `Unable to reach ${base}`,
      },
      { status: 502 },
    );
  }

  const payload = await upstream.text();

  if (!upstream.ok && shouldLogUpstreamFailure(joinedPath, upstream.status)) {
    console.error(
      `Auth proxy upstream failed: ${request.method} ${upstreamUrl} -> ${upstream.status}`,
      payload,
    );
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  const response = new NextResponse(
    upstream.status === 204 || upstream.status === 304 ? null : payload,
    {
      status: upstream.status,
      headers: responseHeaders,
    },
  );

  applyAuthCookiesFromPayload(response, joinedPath, upstream.ok, payload);

  if (joinedPath === "auth/logout" || (joinedPath === "auth/me" && upstream.status === 401)) {
    clearAuthCookies(response);
  }

  return response;
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
