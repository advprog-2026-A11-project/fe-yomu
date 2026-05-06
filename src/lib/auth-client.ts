"use client";

import type {
  AuthModalMode,
  AuthSession,
  AuthTokenResponse,
} from "@/types/auth";

export function normalizeAuthApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_API_URL?.replace(/\/$/, "");

  if (!configured) {
    return "/api/auth-proxy";
  }

  if (
    typeof window !== "undefined"
    && window.location.protocol === "https:"
    && configured.startsWith("http://")
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(authApi(path), {
    ...init,
    credentials: "include",
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

export type AuthErrorIntent = "login" | "register" | "google" | "session";

export function normalizeAuthError(error: unknown, intent: AuthErrorIntent): string {
  const raw = extractErrorMessage(error, "");
  const normalized = raw.toLowerCase();

  if (intent === "login") {
    if (normalized.includes("invalid login credentials")
      || normalized.includes("bad credentials")
      || normalized.includes("invalid credentials")
      || normalized.includes("unauthorized")) {
      return "We could not sign you in. Check your credentials and try again.";
    }

    if (normalized.includes("email not confirmed") || normalized.includes("verify your email")) {
      return "Verify your email first, then try signing in again.";
    }

    return "We could not sign you in right now. Please try again.";
  }

  if (intent === "register") {
    if (normalized.includes("already registered")
      || normalized.includes("already exists")
      || normalized.includes("duplicate")
      || normalized.includes("username is already taken")
      || normalized.includes("email already")) {
      return "We could not create your account. Use a different email or username and try again.";
    }

    if (normalized.includes("password")) {
      return "We could not create your account. Check your password requirements and try again.";
    }

    return "We could not create your account right now. Please try again.";
  }

  if (intent === "google") {
    if (normalized.includes("access_denied")
      || normalized.includes("oauth")
      || normalized.includes("callback")
      || normalized.includes("missing google callback code")) {
      return "We could not complete Google sign in. Please try again.";
    }

    return "We could not complete Google sign in right now. Please try again.";
  }

  return "Your session expired. Please sign in again.";
}

export async function fetchCurrentSession(): Promise<AuthSession> {
  return request<AuthSession>("/auth/me", {
    method: "GET",
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

export async function refreshWithCookie(): Promise<AuthTokenResponse> {
  return request<AuthTokenResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function persistCookieSession(input: {
  accessToken: string;
  refreshToken?: string | null;
}): Promise<void> {
  await fetch("/api/auth-session", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export async function clearCookieSession(): Promise<void> {
  await fetch("/api/auth-session", {
    method: "DELETE",
    credentials: "include",
  });
}

export function getAccessToken(response: AuthTokenResponse): string {
  return response.accessToken || response.access_token || "";
}

export function getDefaultAuthReason(mode: AuthModalMode): string {
  return mode === "register"
    ? "Create an account to save progress, join modules, and keep your streak."
    : "Sign in to continue into the Yomu app experience.";
}
