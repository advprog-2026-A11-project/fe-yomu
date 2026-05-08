import { NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const readingId = url.searchParams.get("readingId");
    
    let path = "/api/messages";
    if (readingId) {
      path += `?readingId=${encodeURIComponent(readingId)}`;
    }

    return await proxyToBackend(path, request, FORUM_BACKEND_OPTIONS);
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
    return await proxyToBackend("/api/messages", request, {
      ...FORUM_BACKEND_OPTIONS,
      method: "POST",
    });
  } catch (error) {
    console.error("Messages POST error:", error);
    return NextResponse.json(
      { error: "Unable to create message. Please try again later." },
      { status: 502 }
    );
  }
}
