import { proxyToBackend } from "@/lib/backend-proxy";
import {
  FORUM_BACKEND_OPTIONS,
  RouteContext,
  getId,
  buildAuthHeaders,
  handleError,
} from "@/app/api/messages/message-api-utils";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/replies`,
      FORUM_BACKEND_OPTIONS
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    const body = await request.text();
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}/replies`, {
      ...FORUM_BACKEND_OPTIONS,
      method: "POST",
      headers: buildAuthHeaders(request, true),
      body,
    });
  } catch (error) {
    return handleError(error);
  }
}
