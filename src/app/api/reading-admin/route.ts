import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";
import { verifyTrustedOrigin } from "@/lib/csrf";

function resolveReadingBackendBaseUrl(): string | null {
  return process.env.BACKEND_BACAAN_QUIZ_URL || null;
}

async function forward(request: NextRequest): Promise<Response> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const csrfViolation = verifyTrustedOrigin(request);
    if (csrfViolation) {
      return csrfViolation;
    }
  }

  const baseUrl = resolveReadingBackendBaseUrl();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "Missing BACKEND_BACAAN_QUIZ_URL on server" },
      { status: 500 },
    );
  }

  return proxyToBackend(`/api/admin/readings${request.nextUrl.search}`, request, {
    backendBaseUrl: baseUrl,
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
export const OPTIONS = forward;
