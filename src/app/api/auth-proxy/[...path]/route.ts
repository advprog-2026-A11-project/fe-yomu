import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function resolveTargetBase(): string | null {
  const configured = process.env.BACKEND_AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!configured) {
    return null;
  }
  return configured.replace(/\/$/, "");
}

async function forward(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const base = resolveTargetBase();
  if (!base) {
    return NextResponse.json(
      { error: "Missing BACKEND_AUTH_API_URL (or NEXT_PUBLIC_AUTH_API_URL) on server" },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const upstreamUrl = new URL(`${base}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("access-control-request-method");
  headers.delete("access-control-request-headers");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(upstreamUrl.toString(), init);
  const payload = await upstream.text();

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  return new NextResponse(payload, {
    status: upstream.status,
    headers: responseHeaders,
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
