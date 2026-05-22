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

function extractRequestOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (origin) {
    return normalizeOrigin(origin);
  }

  const referer = request.headers.get("referer");
  if (!referer) {
    return null;
  }

  try {
    return normalizeOrigin(new URL(referer).origin);
  } catch {
    return null;
  }
}

export function verifyTrustedOrigin(request: NextRequest): NextResponse | null {
  const requestOrigin = extractRequestOrigin(request);
  if (!requestOrigin) {
    return NextResponse.json(
      { error: "Missing Origin or Referer header" },
      { status: 403 },
    );
  }

  if (allowedOriginsForRequest(request).has(requestOrigin)) {
    return null;
  }

  return NextResponse.json(
    { error: "Untrusted Origin" },
    { status: 403 },
  );
}
