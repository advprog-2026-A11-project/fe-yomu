import { NextRequest, NextResponse } from "next/server";

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function configuredOrigins(): string[] {
  const rawOrigins = [
    process.env.FRONTEND_URL,
    process.env.NEXT_PUBLIC_FRONTEND_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  return rawOrigins.map(normalizeOrigin);
}

function allowedOriginsForRequest(request: NextRequest): Set<string> {
  const origins = new Set<string>(configuredOrigins());
  origins.add(normalizeOrigin(request.nextUrl.origin));
  return origins;
}

export function verifyTrustedOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json(
      { error: "Missing Origin header" },
      { status: 403 },
    );
  }

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOriginsForRequest(request).has(normalizedOrigin)) {
    return null;
  }

  return NextResponse.json(
    { error: "Untrusted Origin" },
    { status: 403 },
  );
}
