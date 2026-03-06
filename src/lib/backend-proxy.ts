type BackendResolutionOptions = {
  backendService?: string;
  backendBaseUrl?: string;
};

export type ProxyRequestInit = RequestInit & BackendResolutionOptions;

const BACKEND_SERVICE_URLS = buildBackendServiceUrls();
const DEFAULT_BACKEND_SERVICE = "forum";

export function buildBackendUrl(
  path: string,
  options: BackendResolutionOptions = {}
): string {
  const [firstCandidate] = buildBackendUrlCandidates(path, options);
  if (!firstCandidate) {
    throw new Error("No backend URL candidates available for buildBackendUrl");
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

    throw new Error(
      `No backend URL configured for service "${backendService}". Available services: ${
        availableServices.length > 0 ? availableServices.join(", ") : "none"
      }`
    );
  }

  if (BACKEND_SERVICE_URLS[DEFAULT_BACKEND_SERVICE]?.length) {
    return BACKEND_SERVICE_URLS[DEFAULT_BACKEND_SERVICE];
  }

  const fallbackUrls = flatten(Object.values(BACKEND_SERVICE_URLS));
  if (fallbackUrls.length > 0) {
    return fallbackUrls;
  }

  throw new Error(
    "No backend URLs configured. Please set at least one *_BACKEND_URL environment variable."
  );
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

  throw new Error(
    `Failed to reach backend using: ${candidateUrls.join(", ")}. Last error: ${String(lastError)}`
  );
}

export async function proxyToBackend(
  backendPath: string,
  init: ProxyRequestInit = {}
): Promise<Response> {
  const { backendBaseUrl, backendService, ...fetchInit } = init;

  const response = await fetchFromBackendCandidates(
    backendPath,
    { backendBaseUrl, backendService },
    {
      ...fetchInit,
      cache: "no-store",
    }
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
