import { NextResponse } from "next/server";

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
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.Authorization = authorization;
  }
  return headers;
}

export function handleError(error: unknown) {
  return NextResponse.json(
    { error: `Unable to reach backend: ${String(error)}` },
    { status: 502 }
  );
}
