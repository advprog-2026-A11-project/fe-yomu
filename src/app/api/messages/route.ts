import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

export async function GET() {
  try {
    return await proxyToBackend("/api/messages", FORUM_BACKEND_OPTIONS);
  } catch (error) {
    return NextResponse.json(
      { error: `Unable to reach backend: ${String(error)}` },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    return await proxyToBackend("/api/messages", {
      ...FORUM_BACKEND_OPTIONS,
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
