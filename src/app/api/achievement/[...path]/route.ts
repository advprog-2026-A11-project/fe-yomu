import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/backend-proxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function forward(request: NextRequest, context: RouteContext): Promise<Response> {
  const { path } = await context.params;
  const joinedPath = path.join("/");
  // In be-achievement, the actual routes start with /api/..., e.g., /api/achievements
  const backendPath = `/api/${joinedPath}`;

  return await proxyToBackend(backendPath, request, {
    backendService: "achievement",
  });
}

// Only export GET and PUT since achievements only require these two HTTP methods
export async function GET(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return forward(request, context);
}
