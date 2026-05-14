import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";
import { verifyTrustedOrigin } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function resolveReadingBackendBaseUrl(): string | null {
  return process.env.BACKEND_BACAAN_QUIZ_URL || null;
}

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
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

  const { path } = await context.params;
  const backendPath = `/api/student/readings/${path.join("/")}`;
  const search = request.nextUrl.search;

  return proxyToBackend(`${backendPath}${search}`, request, {
    backendBaseUrl: baseUrl,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
