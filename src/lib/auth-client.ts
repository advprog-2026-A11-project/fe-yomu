"use client";

import type {
  AuthModalMode,
  AuthSession,
  AuthSnapshot,
  AuthTokenResponse,
} from "@/types/auth";

const ACCESS_TOKEN_KEY = "yomu.auth.access-token";
const AUTH_SNAPSHOT_KEY = "yomu.auth.snapshot";
const SESSION_REVALIDATE_MS = 60_000;
const AUTH_COOKIE_KEY = "yomu-auth";

function writeAuthPresenceCookie(token: string | null): void {
  if (typeof document === "undefined") {
    return;
  }

  if (!token) {
    document.cookie = `${AUTH_COOKIE_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${AUTH_COOKIE_KEY}=1; Path=/; Max-Age=2592000; SameSite=Lax`;
}

function getConfiguredAuthBase(): string | undefined {
  return process.env.NEXT_PUBLIC_AUTH_API_URL?.replace(/\/$/, "");
}

export function normalizeAuthApiBase(): string {
  const configured = getConfiguredAuthBase();

  if (!configured) {
    return "/api/auth-proxy";
  }

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    configured.startsWith("http://")
  ) {
    return "/api/auth-proxy";
  }

  return configured;
}

export function authApi(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeAuthApiBase()}${normalizedPath}`;
}

async function parseJson<T>(response: Response): Promise<T | string> {
  const raw = await response.text();

  if (!raw) {
    return "" as T;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(authApi(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await parseJson<T>(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed with status ${response.status}`));
  }

  return (typeof payload === "string" ? ({} as T) : payload) as T;
}

export function extractErrorMessage(error: unknown, fallback = "Request failed"): string {
  if (error instanceof Error) {
    return extractErrorMessage(error.message, fallback);
  }

  if (typeof error === "string") {
    const trimmed = error.trim();
    const jsonStart = trimmed.indexOf("{");

    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(trimmed.slice(jsonStart)) as unknown;
        return extractErrorMessage(parsed, fallback);
      } catch {
        return trimmed || fallback;
      }
    }

    return trimmed || fallback;
  }

  if (error && typeof error === "object") {
    const payload = error as {
      message?: unknown;
      error?: unknown;
      detail?: unknown;
    };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }

    if (typeof payload.detail === "string" && payload.detail.trim()) {
      return payload.detail;
    }
  }

  return fallback;
}

export function persistAccessToken(token: string | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    writeAuthPresenceCookie(null);
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  writeAuthPresenceCookie(token);
}

export function readAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function persistAuthSnapshot(snapshot: AuthSnapshot | null): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!snapshot) {
    window.localStorage.removeItem(AUTH_SNAPSHOT_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function readAuthSnapshot(): AuthSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_SNAPSHOT_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSnapshot;

    if (!parsed.refreshedAt) {
      return {
        ...parsed,
        refreshedAt: 0,
      };
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(AUTH_SNAPSHOT_KEY);
    return null;
  }
}

export function createAuthSnapshot(snapshot: Omit<AuthSnapshot, "refreshedAt">): AuthSnapshot {
  return {
    ...snapshot,
    refreshedAt: Date.now(),
  };
}

export function isAuthSnapshotFresh(snapshot: AuthSnapshot | null): boolean {
  if (!snapshot?.token || !snapshot?.session?.profile?.id) {
    return false;
  }

  return Date.now() - snapshot.refreshedAt < SESSION_REVALIDATE_MS;
}

export function clearPersistedAuth(): void {
  persistAccessToken(null);
  persistAuthSnapshot(null);
}

export async function fetchCurrentSession(token: string): Promise<AuthSession> {
  return request<AuthSession>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function loginWithPassword(input: {
  identifier: string;
  password: string;
}): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerWithPassword(input: {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getGoogleAuthorizationUrl(nextPath?: string): Promise<string> {
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback${
          nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""
        }`
      : "/auth/callback";

  const response = await request<AuthTokenResponse>(
    `/auth/sso/google/url?redirectTo=${encodeURIComponent(redirectTo)}`,
    { method: "GET" },
  );

  if (!response.authorizationUrl) {
    throw new Error(response.message || "Google authorization URL not returned");
  }

  return response.authorizationUrl;
}

export async function completeGoogleAuth(input: {
  code: string;
  state: string;
}): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/sso/google/callback", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAccessToken(response: AuthTokenResponse): string {
  return response.accessToken || response.access_token || "";
}

export function getRefreshToken(response: AuthTokenResponse): string {
  return response.refreshToken || response.refresh_token || "";
}

export function getDefaultAuthReason(mode: AuthModalMode): string {
  return mode === "register"
    ? "Create an account to save progress, join modules, and keep your streak."
    : "Sign in to continue into the Yomu app experience.";
}
