type BackendResolutionOptions = {
  backendService?: string;
  backendBaseUrl?: string;
};

export type ProxyRequestInit = RequestInit & BackendResolutionOptions;

const BACKEND_SERVICE_URLS = buildBackendServiceUrls();
const DEFAULT_BACKEND_SERVICE = "forum";

function buildBackendUrl(
  path: string,
  options: BackendResolutionOptions = {}
): string {
  const [firstCandidate] = buildBackendUrlCandidates(path, options);
  if (!firstCandidate) {
    console.error("No backend URL candidates available for path:", path);
    throw new Error("Backend service is not configured. Please contact support.");
  }
  return firstCandidate;
}

function buildBackendUrlCandidates(
  path: string,
  options: BackendResolutionOptions = {}
): string[] {
  if (isAbsoluteUrl(path)) {
    return [path];
  }

  const normalizedPath = normalizePath(path);
  const baseUrls = resolveBackendBaseUrls(options);
  return baseUrls.map((baseUrl) => `${baseUrl}${normalizedPath}`);
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function resolveBackendBaseUrls(
  options: BackendResolutionOptions = {}
): string[] {
  const { backendBaseUrl, backendService } = options;

  if (backendBaseUrl) {
    return [normalizeBaseUrl(backendBaseUrl)];
  }

  const availableServices = Object.keys(BACKEND_SERVICE_URLS);
  const normalizedService = backendService?.toLowerCase();

  if (normalizedService) {
    const serviceUrls = BACKEND_SERVICE_URLS[normalizedService];
    if (serviceUrls?.length) {
      return serviceUrls;
    }

    console.error(`No backend URL configured for service "${normalizedService}"`);
    throw new Error("Backend service is not configured. Please contact support.");
  }

  if (BACKEND_SERVICE_URLS[DEFAULT_BACKEND_SERVICE]?.length) {
    return BACKEND_SERVICE_URLS[DEFAULT_BACKEND_SERVICE];
  }

  const fallbackUrls = flatten(Object.values(BACKEND_SERVICE_URLS));
  if (fallbackUrls.length > 0) {
    return fallbackUrls;
  }

  console.error("No backend URLs configured in environment variables");
  throw new Error("Backend service is not configured. Please contact support.");
}

function buildBackendServiceUrls(): Record<string, string[]> {
  return Object.entries(process.env).reduce<Record<string, string[]>>(
    (services, [key, value]) => {
      if (!key.endsWith("_BACKEND_URL") || !value) {
        return services;
      }

      const serviceName = key
        .slice(0, -"_BACKEND_URL".length)
        .toLowerCase();
      services[serviceName] = value
        .split(",")
        .map((url) => normalizeBaseUrl(url.trim()))
        .filter(Boolean);

      return services;
    },
    {}
  );
}

function normalizeBaseUrl(url: string): string {
  if (!url) {
    return url;
  }

  return url.replace(/\/+$/, "");
}

function flatten<T>(items: T[][]): T[] {
  return items.reduce<T[]>((acc, current) => acc.concat(current), []);
}

async function fetchFromBackendCandidates(
  backendPath: string,
  options: BackendResolutionOptions,
  init: RequestInit,
  sourceRequest?: Request
): Promise<Response> {
  let lastError: unknown;
  const candidateUrls = buildBackendUrlCandidates(backendPath, options);

  const proxyHeaders = buildProxyHeaders(sourceRequest);
  const mergedHeaders = {
    ...proxyHeaders,
    ...(init.headers || {}),
  };
  const mergedInit: RequestInit = {
    ...init,
    headers: mergedHeaders,
  };

  for (const url of candidateUrls) {
    try {
      return await fetch(url, mergedInit);
    } catch (error) {
      lastError = error;
    }
  }

  console.error(`Failed to reach backend for path ${backendPath}. Last error:`, lastError);
  throw new Error("Failed to connect to backend service. Please try again later.");
}

export async function proxyToBackend(
  backendPath: string,
  init: ProxyRequestInit = {},
  sourceRequest?: Request
): Promise<Response> {
  const { backendBaseUrl, backendService, ...fetchInit } = init;

  const response = await fetchFromBackendCandidates(
    backendPath,
    { backendBaseUrl, backendService },
    {
      ...fetchInit,
      cache: "no-store",
    },
    sourceRequest
  );

  const status = response.status;
  const bodyAllowed = status !== 204 && status !== 205 && status !== 304;
  const headers = new Headers();

  copyHeaderIfPresent(response.headers, headers, "content-type");
  copyHeaderIfPresent(response.headers, headers, "cache-control");

  if (!bodyAllowed) {
    return new Response(null, {
      status,
      headers,
    });
  }

  return new Response(response.body, {
    status,
    headers,
  });
}

function extractBearerToken(headers: Headers): string | null {
  const authHeader = headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader;
  }
  return null;
}

function buildProxyHeaders(sourceRequest?: Request): Record<string, string> {
  const headers: Record<string, string> = {};

  if (!sourceRequest) {
    return headers;
  }

  const headersToForward = [
    "content-type",
    "accept",
    "accept-language",
    "user-agent",
    "cache-control",
    "pragma",
  ];

  for (const headerName of headersToForward) {
    const value = sourceRequest.headers.get(headerName);
    if (value) {
      headers[headerName] = value;
    }
  }

  const bearerToken = extractBearerToken(sourceRequest.headers);
  if (bearerToken) {
    headers.authorization = bearerToken;
  }

  return headers;
}

function copyHeaderIfPresent(
  source: Headers,
  target: Headers,
  headerName: string
): void {
  const value = source.get(headerName);
  if (value) {
    target.set(headerName, value);
  }
}
