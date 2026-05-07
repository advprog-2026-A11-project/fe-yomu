import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";
import { buildAuthHeaders } from "@/app/api/messages/message-api-utils";

const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const readingId = url.searchParams.get("readingId");
    
    let path = "/api/messages";
    if (readingId) {
      path += `?readingId=${encodeURIComponent(readingId)}`;
    }
    
    return await proxyToBackend(path, FORUM_BACKEND_OPTIONS);
  } catch (error) {
    console.error("Messages GET error:", error);
    return NextResponse.json(
      { error: "Unable to load messages. Please try again later." },
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
      headers: buildAuthHeaders(request, true),
      body,
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { error: "Unable to create message. Please try again later." },
      { status: 502 }
    );
  }
}
