import { proxyToBackend } from "@/lib/backend-proxy";
import {
  FORUM_BACKEND_OPTIONS,
  handleError,
} from "@/app/api/messages/message-api-utils";

type RouteContext = {
  params: { id: string; replyId: string } | Promise<{ id: string; replyId: string }>;
};

async function getParams(context: RouteContext): Promise<{ id: string; replyId: string }> {
  return await context.params;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id, replyId } = await getParams(context);
    
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/replies/${encodeURIComponent(replyId)}`,
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
    const { id, replyId } = await getParams(context);
    
    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(id)}/replies/${encodeURIComponent(replyId)}`,
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
