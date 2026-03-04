export type BackendService = "forum" | "reading" | "clan" | "achievement" | "user";

const SERVICE_BACKEND_URLS: Record<BackendService, string | undefined> = {
  forum: process.env.FORUM_BACKEND_URL,
  reading: process.env.READING_BACKEND_URL,
  clan: process.env.CLAN_BACKEND_URL,
  achievement: process.env.ACHIEVEMENT_BACKEND_URL,
  user: process.env.USER_BACKEND_URL,
};

function getBackendUrl(service: BackendService): string {
  const url = SERVICE_BACKEND_URLS[service];
  if (!url) {
    throw new Error(
      `Backend URL not configured for service: ${service}. Set ${service.toUpperCase()}_BACKEND_URL environment variable.`
    );
  }
  return url;
}

export function buildBackendUrl(service: BackendService, path: string): string {
  const baseUrl = getBackendUrl(service);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function fetchFromBackend(
  service: BackendService,
  backendPath: string,
  init: RequestInit
): Promise<Response> {
  const url = buildBackendUrl(service, backendPath);
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new Error(
      `Failed to reach ${service} backend at ${url}. Error: ${String(error)}`
    );
  }
}

export async function proxyToBackend(
  service: BackendService,
  backendPath: string,
  init: RequestInit = {}
): Promise<Response> {
  const response = await fetchFromBackend(service, backendPath, {
    ...init,
    cache: "no-store",
  });

  const status = response.status;
  const bodyAllowed = status !== 204 && status !== 205 && status !== 304;
  const body = bodyAllowed ? await response.text() : null;
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  return new Response(body, {
    status,
    headers,
  });
}
