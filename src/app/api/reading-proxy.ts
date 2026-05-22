import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";
import { verifyTrustedOrigin } from "@/lib/csrf";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type RouteHandler = (request: NextRequest, context: RouteContext) => Promise<Response>;

type ReadingRouteHandlers = {
  GET: RouteHandler;
  POST: RouteHandler;
  PUT: RouteHandler;
  PATCH: RouteHandler;
  DELETE: RouteHandler;
  OPTIONS: RouteHandler;
};

function resolveReadingBackendBaseUrl(): string | null {
  return process.env.BACKEND_BACAAN_QUIZ_URL || null;
}

function createForward(prefix: "/api/student/readings" | "/api/admin/readings"): RouteHandler {
  return async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
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
    const backendPath = `${prefix}/${path.join("/")}`;
    const search = request.nextUrl.search;

    return proxyToBackend(`${backendPath}${search}`, request, {
      backendBaseUrl: baseUrl,
    });
  };
}

export function createReadingRouteHandlers(
  prefix: "/api/student/readings" | "/api/admin/readings",
): ReadingRouteHandlers {
  const forward = createForward(prefix);
  return {
    GET: forward,
    POST: forward,
    PUT: forward,
    PATCH: forward,
    DELETE: forward,
    OPTIONS: forward,
  };
}
