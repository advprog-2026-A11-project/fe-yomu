import { proxyToBackend } from "@/lib/backend-proxy";
import {
  FORUM_BACKEND_OPTIONS,
  handleError,
} from "@/app/api/messages/message-api-utils";

type UserReactionRouteContext = {
  params:
    | { id: string; userId: string }
    | Promise<{ id: string; userId: string }>;
};

export async function GET(request: Request, context: UserReactionRouteContext) {
  try {
    const params = await context.params;

    return await proxyToBackend(
      `/api/messages/${encodeURIComponent(params.id)}/reactions/user/${encodeURIComponent(params.userId)}`,
      request,
      FORUM_BACKEND_OPTIONS
    );
  } catch (error) {
    return handleError(error);
  }
}
