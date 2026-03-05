import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

type RouteContext = {
  params: { id: string; replyId: string } | Promise<{ id: string; replyId: string }>;
};

async function getParams(context: RouteContext): Promise<{ id: string; replyId: string }> {
  return await context.params;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, replyId } = await getParams(context);
    const body = await request.text();
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/replies/${encodeURIComponent(replyId)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, replyId } = await getParams(context);
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/replies/${encodeURIComponent(replyId)}`,
      {
        method: "DELETE",
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}
