import { proxyToBackend } from "@/lib/backend-proxy";
import {
  FORUM_BACKEND_OPTIONS,
  RouteContext,
  getId,
  handleError,
} from "@/app/api/messages/message-api-utils";

export async function PUT(request: Request, context: RouteContext) {
  try {
    const id = await getId(context);
    
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}`,
      request,
      {
        ...FORUM_BACKEND_OPTIONS,
        method: "PUT",
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
      `/api/messages/${encodeURIComponent(id)}`,
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
