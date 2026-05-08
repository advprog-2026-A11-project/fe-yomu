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
      request,
      FORUM_BACKEND_OPTIONS
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/reactions`,
      request,
      {
        ...FORUM_BACKEND_OPTIONS,
        method: "POST",
      }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/reactions`,
      request,
      {
        ...FORUM_BACKEND_OPTIONS,
        method: "DELETE",
      }
    );
  } catch (error) {
    return handleError(error);
  }
}
