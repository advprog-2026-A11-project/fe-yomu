type BackendResolutionOptions = {
  backendService?: string;
  backendBaseUrl?: string;
};

type ProxyOptions = BackendResolutionOptions & {
  method?: string;
  headers?: Record<string, string>;
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
  init: RequestInit
): Promise<Response> {
  let lastError: unknown;
  const candidateUrls = buildBackendUrlCandidates(backendPath, options);

  for (const url of candidateUrls) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
    }
  }

  console.error(`Failed to reach backend for path ${backendPath}. Last error:`, lastError);
  throw new Error("Failed to connect to backend service. Please try again later.");
}

function extractTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === "yomu-access-token") {
      const token = decodeURIComponent(valueParts.join("="));
      if (token) {
        return `Bearer ${token}`;
      }
    }
  }
  return null;
}

export async function proxyToBackend(
  backendPath: string,
  sourceRequest: Request,
  options: ProxyOptions = {}
): Promise<Response> {
  const { backendBaseUrl, backendService, method, headers: customHeaders = {}, ...rest } = options;

  try {
    // Extract auth from cookie
    const cookieHeader = sourceRequest.headers.get("cookie");
    const authHeader = extractTokenFromCookie(cookieHeader);

    // Determine if we need to read the body
    const shouldReadBody = ["POST", "PUT", "PATCH", "DELETE"].includes(
      method || sourceRequest.method
    );
    const body = shouldReadBody ? await sourceRequest.text() : undefined;

    // Build request init
    const fetchInit: RequestInit = {
      method: method || sourceRequest.method,
      cache: "no-store",
      headers: {
        // Forward common headers from source request
        ...(sourceRequest.headers.get("content-type") && {
          "content-type": sourceRequest.headers.get("content-type")!,
        }),
        ...(sourceRequest.headers.get("accept") && {
          "accept": sourceRequest.headers.get("accept")!,
        }),
        ...(sourceRequest.headers.get("accept-language") && {
          "accept-language": sourceRequest.headers.get("accept-language")!,
        }),
        ...(sourceRequest.headers.get("userId") && {
          userId: sourceRequest.headers.get("userId")!,
        }),
        // Add auth header if available
        ...(authHeader && { authorization: authHeader }),
        // Apply custom headers (overrides defaults)
        ...customHeaders,
      },
      ...(body && { body }),
      ...rest,
    };

    const response = await fetchFromBackendCandidates(
      backendPath,
      { backendBaseUrl, backendService },
      fetchInit
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
  } catch (error) {
    console.error("[proxyToBackend] Error:", error);
    throw error;
  }
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
