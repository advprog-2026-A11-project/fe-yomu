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
  clearPersistedAuth,
  createAuthSnapshot,
  completeGoogleAuth,
  fetchCurrentSession,
  getAccessToken,
  getDefaultAuthReason,
  getGoogleAuthorizationUrl,
  getRefreshToken,
  isAuthSnapshotFresh,
  loginWithPassword,
  persistAccessToken,
  persistAuthSnapshot,
  persistRefreshToken,
  readAccessToken,
  readAuthSnapshot,
  readRefreshToken,
  refreshWithToken,
  registerWithPassword,
} from "@/lib/auth-client";
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
  token: string | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authModal: AuthModalIntent | null;
  toast: ToastState;
  bootstrap: (token: string) => Promise<void>;
  signIn: (input: { identifier: string; password: string }) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  startGoogleSignIn: (nextPath?: string) => Promise<void>;
  finishGoogleSignIn: (input: {
    code: string;
    state: string;
    nextPath?: string;
  }) => Promise<void>;
  refreshSession: () => Promise<void>;
  signOut: () => void;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [status, setStatus] = useState<AuthStatus>("loading");
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authModal, setAuthModal] = useState<AuthModalIntent | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const syncSession = useCallback(async (nextToken: string, nextRefreshToken?: string | null) => {
    const nextSession = await fetchCurrentSession(nextToken);
    setToken(nextToken);
    setSession(nextSession);
    setStatus("authenticated");
    persistAccessToken(nextToken);
    persistRefreshToken(nextRefreshToken ?? readRefreshToken());
    persistAuthSnapshot(createAuthSnapshot({ token: nextToken, session: nextSession }));
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setSession(null);
    setStatus("unauthenticated");
    clearPersistedAuth();
  }, []);

  const bootstrap = useCallback(async (nextToken: string, nextRefreshToken?: string | null) => {
    try {
      await syncSession(nextToken, nextRefreshToken);
    } catch (error) {
      const refreshToken = nextRefreshToken ?? readRefreshToken();
      if (!refreshToken) {
        clearAuth();
        throw error;
      }

      const refreshed = await refreshWithToken(refreshToken);
      const refreshedAccessToken = getAccessToken(refreshed);
      if (!refreshedAccessToken) {
        clearAuth();
        throw error;
      }

      await syncSession(refreshedAccessToken, getRefreshToken(refreshed) || refreshToken);
    }
  }, [clearAuth, syncSession]);

  useEffect(() => {
    const snapshot = readAuthSnapshot();
    const storedToken = readAccessToken();
    const storedRefreshToken = readRefreshToken();

    if (snapshot?.session) {
      setToken(snapshot.token);
      setSession(snapshot.session);
      setStatus("authenticated");
      persistAccessToken(snapshot.token);
    }

    if (!storedToken && !storedRefreshToken) {
      setStatus("unauthenticated");
      return;
    }

    if (storedToken && snapshot && snapshot.token === storedToken && isAuthSnapshotFresh(snapshot)) {
      return;
    }

    void bootstrap(storedToken || "", storedRefreshToken).catch(() => {
      setToast({
        message: "Your session expired. Please sign in again.",
        tone: "error",
      });
    });
  }, [bootstrap]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (!event.key) {
        return;
      }

      if (event.key === "yomu.auth.access-token" && !event.newValue) {
        clearAuth();
      }

      if (event.key === "yomu.auth.snapshot" && event.newValue) {
        try {
          const snapshot = JSON.parse(event.newValue) as {
            token: string;
            session: AuthSession;
            refreshedAt?: number;
          };

          setToken(snapshot.token);
          setSession(snapshot.session);
          setStatus("authenticated");
        } catch {
          clearAuth();
        }
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [clearAuth]);

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

  const handleAuthSuccess = useCallback(
    async (
      response: AuthTokenResponse,
      fallbackNextPath?: string,
      successMessage = "Welcome back to Yomu.",
    ) => {
      const nextToken = getAccessToken(response);
      if (!nextToken) {
        throw new Error("Auth response did not contain an access token");
      }

      await bootstrap(nextToken, getRefreshToken(response));
      setAuthModal(null);
      setToast({
        message: response.message || successMessage,
        tone: "success",
      });

      const nextPath = authModal?.nextPath || fallbackNextPath || "/dashboard";
      router.replace(nextPath);
    },
    [authModal?.nextPath, bootstrap, router],
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
      const authorizationUrl = await getGoogleAuthorizationUrl(
        nextPath || authModal?.nextPath || inferNextPath(pathname || "/"),
      );
      window.location.assign(authorizationUrl);
    },
    [authModal?.nextPath, pathname],
  );

  const finishGoogleSignIn = useCallback(
    async (input: { code: string; state: string; nextPath?: string }) => {
      const response = await completeGoogleAuth(input);
      await handleAuthSuccess(response, input.nextPath || "/dashboard");
    },
    [handleAuthSuccess],
  );

  const refreshSession = useCallback(async () => {
    const refreshToken = readRefreshToken();
    if (refreshToken) {
      const response = await refreshWithToken(refreshToken);
      const refreshedAccessToken = getAccessToken(response);
      if (!refreshedAccessToken) {
        throw new Error("Refresh response did not contain an access token");
      }
      await bootstrap(refreshedAccessToken, getRefreshToken(response) || refreshToken);
      return;
    }

    if (!token) {
      return;
    }

    await bootstrap(token);
  }, [bootstrap, token]);

  const signOut = useCallback(() => {
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
      token,
      session,
      isAuthenticated: status === "authenticated" && !!session?.profile?.id,
      isAdmin: session?.profile?.role === "ADMIN",
      authModal,
      toast,
      bootstrap,
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
      bootstrap,
      clearToast,
      closeAuthModal,
      openAuthModal,
      refreshSession,
      register,
      session,
      signIn,
      signOut,
      startGoogleSignIn,
      status,
      toast,
      token,
      finishGoogleSignIn,
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
