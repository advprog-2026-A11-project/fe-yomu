"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearCookieSession,
  extractErrorMessage,
  fetchCurrentSession,
  getAccessToken,
  getDefaultAuthReason,
  loginWithPassword,
  normalizeAuthError,
  persistCookieSession,
  refreshWithCookie,
  registerWithPassword,
} from "@/lib/auth-client";
import { getSupabaseClient } from "@/lib/supabase";
import type {
  AuthModalIntent,
  AuthModalMode,
  AuthSession,
  AuthStatus,
  AuthTokenResponse,
} from "@/types/auth";

type ToastTone = "neutral" | "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
} | null;

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authModal: AuthModalIntent | null;
  toast: ToastState;
  signIn: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    phone: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  startGoogleSignIn: (nextPath?: string) => Promise<void>;
  finishGoogleSignIn: (input: {
    code: string;
    state?: string;
    nextPath?: string;
  }) => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  openAuthModal: (intent?: Partial<AuthModalIntent>) => void;
  closeAuthModal: () => void;
  clearToast: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function inferNextPath(pathname: string): string {
  if (!pathname || pathname === "/") {
    return "/dashboard";
  }

  return pathname;
}

function isUnauthorizedSessionError(error: unknown): boolean {
  const raw = extractErrorMessage(error, "").toLowerCase();
  return raw.includes("401")
    || raw.includes("unauthorized")
    || raw.includes("missing bearer token");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalIntent | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const syncSession = useCallback(async () => {
    const nextSession = await fetchCurrentSession();
    setSession(nextSession);
    setStatus("authenticated");
  }, []);

  const clearAuth = useCallback(() => {
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    void syncSession().catch((error) => {
      clearAuth();
      if (!isUnauthorizedSessionError(error)) {
        setToast({
          message: normalizeAuthError(error, "session"),
          tone: "error",
        });
      }
    });
  }, [clearAuth, syncSession]);

  const openAuthModal = useCallback(
    (intent?: Partial<AuthModalIntent>) => {
      const mode = intent?.mode || "login";
      setAuthModal({
        mode,
        nextPath: intent?.nextPath || inferNextPath(pathname || "/"),
        reason: intent?.reason || getDefaultAuthReason(mode),
      });
    },
    [pathname],
  );

  const closeAuthModal = useCallback(() => {
    setAuthModal(null);
  }, []);

  const completeAuthenticatedSession = useCallback(
    async (message: string, nextPath?: string) => {
      await syncSession();
      setAuthModal(null);
      setToast({
        message,
        tone: "success",
      });
      router.replace(nextPath || authModal?.nextPath || "/dashboard");
    },
    [authModal?.nextPath, router, syncSession],
  );

  const handleAuthSuccess = useCallback(
    async (
      response: AuthTokenResponse,
      fallbackNextPath?: string,
      successMessage = "Welcome back to Yomu.",
    ) => completeAuthenticatedSession(
      response.message || successMessage,
      fallbackNextPath,
    ),
    [completeAuthenticatedSession],
  );

  const signIn = useCallback(
    async (input: { identifier: string; password: string }) => {
      const response = await loginWithPassword(input);
      await handleAuthSuccess(response, undefined, "Welcome back to Yomu.");
    },
    [handleAuthSuccess],
  );

  const register = useCallback(
    async (input: {
      email: string;
      phone: string;
      password: string;
      username?: string;
      displayName?: string;
    }) => {
      const response = await registerWithPassword(input);
      const nextToken = getAccessToken(response);
      if (nextToken) {
        await handleAuthSuccess(response, undefined, "Your Yomu account is ready.");
        return;
      }

      setAuthModal((currentModal) => currentModal
        ? {
            ...currentModal,
            mode: "login",
            reason: "Account created. Verify your email, then sign in.",
          }
        : null);
      setToast({
        message: response.message || "Account created. Please verify your email before signing in.",
        tone: "success",
      });
    },
    [handleAuthSuccess],
  );

  const startGoogleSignIn = useCallback(
    async (nextPath?: string) => {
      const redirectTo = `${window.location.origin}/auth/callback${
        nextPath || authModal?.nextPath || pathname
          ? `?next=${encodeURIComponent(nextPath || authModal?.nextPath || inferNextPath(pathname || "/"))}`
          : ""
      }`;

      const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      if (data.url) {
        window.location.assign(data.url);
      }
    },
    [authModal?.nextPath, pathname],
  );

  const finishGoogleSignIn = useCallback(
    async (input: { code: string; state?: string; nextPath?: string }) => {
      const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(input.code);
      if (error) {
        throw error;
      }

      if (!data.session?.access_token) {
        throw new Error("Google sign in did not return an access token");
      }

      await persistCookieSession({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token ?? null,
      });
      await completeAuthenticatedSession("Welcome back to Yomu.", input.nextPath);
    },
    [completeAuthenticatedSession],
  );

  const refreshSession = useCallback(async () => {
    await refreshWithCookie();
    await syncSession();
  }, [syncSession]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth-proxy/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } catch {
      // Local sign-out still wins even if backend logout is unavailable.
    }

    try {
      await getSupabaseClient().auth.signOut();
    } catch {
      // Local sign-out still wins even if Supabase cleanup fails.
    }

    await clearCookieSession();
    clearAuth();
    setAuthModal(null);
    setToast({
      message: "You have been signed out.",
      tone: "neutral",
    });
    router.replace("/");
  }, [clearAuth, router]);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isAuthenticated: status === "authenticated" && !!session?.profile?.id,
      isAdmin: session?.profile?.role === "ADMIN",
      authModal,
      toast,
      signIn,
      register,
      startGoogleSignIn,
      finishGoogleSignIn,
      refreshSession,
      signOut,
      openAuthModal,
      closeAuthModal,
      clearToast,
    }),
    [
      authModal,
      clearToast,
      closeAuthModal,
      finishGoogleSignIn,
      openAuthModal,
      refreshSession,
      register,
      session,
      signIn,
      signOut,
      startGoogleSignIn,
      status,
      toast,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
