import { getAuthHeaders } from "@/lib/auth-headers";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  includeAuth?: boolean;
}

export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  return response.json() as Promise<T>;
}

export async function apiRequest<T = unknown>(
  url: string,
  options: ApiOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    cache = "no-store",
    includeAuth = true,
  } = options;

  const requestInit: RequestInit = {
    method,
    cache,
    headers: {
      "Content-Type": "application/json",
      ...(includeAuth ? getAuthHeaders() : {}),
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);
  const data = await parseResponse<T>(response);

  if (!response.ok) {
    const errorData = data as { message?: string; error?: string };
    throw new Error(errorData.message || errorData.error || `Request failed: ${response.status}`);
  }

  return data;
}

export async function apiGet<T = unknown>(url: string, options?: Omit<ApiOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "GET" });
}

export async function apiPost<T = unknown>(url: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "POST", body });
}

export async function apiPut<T = unknown>(url: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "PUT", body });
}

export async function apiPatch<T = unknown>(url: string, body?: unknown, options?: Omit<ApiOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "PATCH", body });
}

export async function apiDelete<T = unknown>(url: string, options?: Omit<ApiOptions, "method" | "body">) {
  return apiRequest<T>(url, { ...options, method: "DELETE" });
}
