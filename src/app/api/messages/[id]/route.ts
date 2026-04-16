import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.id;
}

function buildAuthHeaders(request: Request): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.Authorization = authorization;
  }
  return headers;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    const body = await request.text();
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}`, {
      ...FORUM_BACKEND_OPTIONS,
      method: "PUT",
      headers: buildAuthHeaders(request),
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}`, {
      ...FORUM_BACKEND_OPTIONS,
      method: "DELETE",
      headers: { Authorization: request.headers.get("authorization") || "" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}
