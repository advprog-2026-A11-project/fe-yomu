import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

async function getId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.id;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}/replies`);
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    const body = await request.text();
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}
