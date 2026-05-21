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

  try {
    const configuredUrl = new URL(configured);
    if (
      typeof globalThis.location !== "undefined"
      && globalThis.location.protocol === "https:"
      && configuredUrl.protocol === "http:"
    ) {
      return "/api/auth-proxy";
    }
  } catch {
    return configured;
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
      validationErrors?: unknown;
      validation_errors?: unknown;
    };

    const validationErrors = payload.validationErrors ?? payload.validation_errors;
    if (validationErrors && typeof validationErrors === "object") {
      const firstValidationMessage = Object.values(validationErrors as Record<string, unknown>)
        .find((value) => typeof value === "string" && value.trim());
      if (typeof firstValidationMessage === "string") {
        return firstValidationMessage;
      }
    }

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

function sanitizeAuthMessage(message: string, fallback: string): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return fallback;
  }

  const firstLine = trimmed.split(/\r?\n/)[0]?.trim() || fallback;
  if (!firstLine) {
    return fallback;
  }

  if (firstLine.startsWith("org.") || firstLine.startsWith("java.")) {
    return fallback;
  }

  return firstLine.length > 180 ? `${firstLine.slice(0, 177)}...` : firstLine;
}

export type AuthErrorIntent = "login" | "register" | "google" | "session" | "password";

export function normalizeAuthError(error: unknown, intent: AuthErrorIntent): string {
  const raw = sanitizeAuthMessage(extractErrorMessage(error, ""), "");
  const normalized = raw.toLowerCase();

  if (intent === "login") {
    if (normalized.includes("invalid login credentials")
      || normalized.includes("bad credentials")
      || normalized.includes("invalid credentials")
      || normalized.includes("unauthorized")) {
      return "Invalid email, username, or password.";
    }

    if (normalized.includes("phone number is not registered")) {
      return "That phone number is not registered.";
    }

    if (normalized.includes("phone login is not available for this account")) {
      return "This account cannot sign in with a phone number yet.";
    }

    if (normalized.includes("email not confirmed") || normalized.includes("verify your email")) {
      return "Please verify your email first, then try signing in again.";
    }

    if (raw) {
      return raw;
    }

    return "We could not sign you in right now. Please try again.";
  }

  if (intent === "register") {
    if (normalized.includes("already registered")
      || normalized.includes("already exists")
      || normalized.includes("duplicate")
      || normalized.includes("email already")) {
      return "That email address is already in use.";
    }

    if (normalized.includes("username is already taken")
      || normalized.includes("username already")) {
      return "That username is already in use.";
    }

    if (normalized.includes("phone already")) {
      return "That phone number is already in use.";
    }

    if (normalized.includes("phone must contain 8-15 digits")) {
      return "Phone number must contain 8-15 digits.";
    }

    if (normalized.includes("password should")
      || normalized.includes("password must")
      || normalized.includes("weak password")
      || normalized.includes("password")) {
      return raw || "Your password does not meet the required strength rules.";
    }

    if (raw) {
      return raw;
    }

    return "We could not create your account right now. Please try again.";
  }

  if (intent === "google") {
    if (normalized.includes("access_denied")
      || normalized.includes("oauth")
      || normalized.includes("callback")
      || normalized.includes("missing google callback code")) {
      return "Google sign in was cancelled or could not be completed.";
    }

    if (raw) {
      return raw;
    }

    return "We could not complete Google sign in right now. Please try again.";
  }

  if (intent === "password") {
    if (normalized.includes("invalid login credentials")
      || normalized.includes("bad credentials")
      || normalized.includes("invalid credentials")) {
      return "Current password is incorrect.";
    }

    if (normalized.includes("currentpassword is required")) {
      return "Current password is required.";
    }

    if (normalized.includes("newpassword must be at least 8 characters")) {
      return "Password must be at least 8 characters.";
    }

    if (normalized.includes("weak password")) {
      return raw || "Your new password is too weak.";
    }

    if (normalized.includes("cannot change password yet")) {
      return "This account cannot change password yet.";
    }

    if (normalized.includes("same password")) {
      return "Please choose a different password.";
    }

    if (raw) {
      return raw;
    }

    return "We could not update your password right now. Please try again.";
  }

  if (raw) {
    return raw;
  }

  return "Your session expired. Please sign in again.";
}

export async function fetchCurrentSession(): Promise<AuthSession> {
  return request<AuthSession>("/auth/me", {
    method: "GET",
  });
}

export async function fetchAuthPresence(): Promise<boolean> {
  const response = await fetch("/api/auth-session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return false;
  }

  const payload = (await parseJson<{ authenticated?: boolean }>(response)) as {
    authenticated?: boolean;
  };

  return Boolean(payload.authenticated);
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
  phone: string;
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

export async function changePassword(input: {
  currentPassword?: string;
  newPassword: string;
}): Promise<{ message?: string }> {
  return request<{ message?: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    }),
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
