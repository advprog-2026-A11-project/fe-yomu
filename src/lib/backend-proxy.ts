const BACKEND_URL_CANDIDATES = [
  process.env.FORUM_BACKEND_URL
].filter((url): url is string => Boolean(url));

export function buildBackendUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL_CANDIDATES[0]}${normalizedPath}`;
}

function buildBackendUrlWithBase(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

async function fetchFromBackendCandidates(
  backendPath: string,
  init: RequestInit
): Promise<Response> {
  let lastError: unknown;

  for (const baseUrl of BACKEND_URL_CANDIDATES) {
    try {
      return await fetch(buildBackendUrlWithBase(baseUrl, backendPath), init);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(
    `Failed to reach backend using: ${BACKEND_URL_CANDIDATES.join(", ")}. Last error: ${String(lastError)}`
  );
}

export async function proxyToBackend(
  backendPath: string,
  init: RequestInit = {}
): Promise<Response> {
  const response = await fetchFromBackendCandidates(backendPath, {
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
