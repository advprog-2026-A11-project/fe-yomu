import { NextResponse } from "next/server";
import { proxyToBackend } from "@/proxy/backend-proxy";

export async function GET() {
  try {
    return await proxyToBackend("forum", "/api/messages");
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
    return await proxyToBackend("forum", "/api/messages", {
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
