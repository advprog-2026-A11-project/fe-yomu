import { proxyToBackend } from "@/lib/backend-proxy";
import {
  FORUM_BACKEND_OPTIONS,
  RouteContext,
  getId,
  handleError,
} from "@/app/api/messages/message-api-utils";

export async function GET(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/reactions`,
      FORUM_BACKEND_OPTIONS,
      request
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    const body = await request.text();
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}/reactions`, {
      ...FORUM_BACKEND_OPTIONS,
      method: "POST",
      body,
    }, request);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    const body = await request.text();
    return await proxyToBackend(`/api/messages/${encodeURIComponent(id)}/reactions`, {
      ...FORUM_BACKEND_OPTIONS,
      method: "DELETE",
      body,
    }, request);
  } catch (error) {
    return handleError(error);
  }
}
