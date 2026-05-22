import { proxyToBackend } from "@/lib/backend-proxy";

async function handleClanRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}

export {
  handleClanRequest as GET,
  handleClanRequest as POST,
  handleClanRequest as PUT,
  handleClanRequest as PATCH,
  handleClanRequest as DELETE,
};
