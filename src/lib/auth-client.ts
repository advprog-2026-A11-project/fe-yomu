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

  if (!raw) return "" as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(authApi(path), {
    ...init,
    credentials: "include", // ✅ cookie-based auth
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const payload = await parseJson<T>(response);

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `Request failed with status ${response.status}`)
    );
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
        const parsed = JSON.parse(trimmed.slice(jsonStart));
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

    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.error === "string") return payload.error;
    if (typeof payload.detail === "string") return payload.detail;
  }

  return fallback;
}

function sanitizeAuthMessage(message: string, fallback: string): string {
  const trimmed = message.trim();
  if (!trimmed) return fallback;

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() || fallback;

  if (
    firstLine.startsWith("org.") ||
    firstLine.startsWith("java.")
  ) {
    return fallback;
  }

  return firstLine.length > 180
    ? `${firstLine.slice(0, 177)}...`
    : firstLine;
}

export type AuthErrorIntent = "login" | "register" | "google" | "session";

export function normalizeAuthError(error: unknown, intent: AuthErrorIntent): string {
  const raw = sanitizeAuthMessage(extractErrorMessage(error, ""), "");
  const normalized = raw.toLowerCase();

  if (intent === "login") {
    if (
      normalized.includes("invalid credentials") ||
      normalized.includes("unauthorized") ||
      normalized.includes("bad credentials")
    ) {
      return "Invalid email, username, or password.";
    }

    if (normalized.includes("verify your email")) {
      return "Please verify your email first.";
    }

    return raw || "We could not sign you in.";
  }

  if (intent === "register") {
    if (
      normalized.includes("already") ||
      normalized.includes("duplicate")
    ) {
      return "That email or username is already in use.";
    }

    if (normalized.includes("password")) {
      return raw || "Password is too weak.";
    }

    return raw || "Registration failed.";
  }

  if (intent === "google") {
    if (
      normalized.includes("oauth") ||
      normalized.includes("access_denied")
    ) {
      return "Google sign-in failed or cancelled.";
    }

    return raw || "Google login failed.";
  }

  return raw || "Session expired. Please login again.";
}

//
// ✅ FINAL VERSION (NO TOKEN PARAM)
//
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
    ? "Create an account to save progress and track achievements."
    : "Sign in to continue.";
}