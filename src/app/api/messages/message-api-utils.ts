import { NextResponse } from "next/server";
import { AUTH_ACCESS_COOKIE } from "@/lib/auth-cookies";

export const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

export type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function getId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.id;
}

export function buildAuthHeaders(request: Request, includeContentType = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  const authorization = request.headers.get("authorization") || readAuthorizationFromCookie(request);
  if (authorization) {
    headers.Authorization = authorization;
  }
  return headers;
}

function readAuthorizationFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    return null;
  }

  for (const part of cookieHeader.split(";")) {
    const [rawName, ...valueParts] = part.trim().split("=");
    if (rawName === AUTH_ACCESS_COOKIE) {
      const token = decodeURIComponent(valueParts.join("="));
      return token ? `Bearer ${token}` : null;
    }
  }

  return null;
}

export function handleError(error: unknown) {
  return NextResponse.json(
    { error: `Unable to reach backend: ${String(error)}` },
    { status: 502 }
  );
}
