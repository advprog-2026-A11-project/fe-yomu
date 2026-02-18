import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET() {
  try {
    return await proxyToBackend("/api/messages");
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
