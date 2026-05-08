import { NextResponse } from "next/server";

export const FORUM_BACKEND_OPTIONS = { backendService: "forum" as const };

export type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

export async function getId(context: RouteContext): Promise<string> {
  const params = await context.params;
  return params.id;
}

export function handleError(error: unknown) {
  console.error("API error:", error);
  return NextResponse.json(
    { error: "An error occurred. Please try again later." },
    { status: 502 }
  );
}
