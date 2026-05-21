import { proxyToBackend } from "@/lib/backend-proxy";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}

export async function PUT(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = `/api/clan/${path.join("/")}`;
  return proxyToBackend(backendPath, request);
}
