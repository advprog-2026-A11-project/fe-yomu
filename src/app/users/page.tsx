"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AuthResponse = {
  accessToken?: string;
  access_token?: string;
  authorizationUrl?: string;
  message?: string;
};

function normalizeApiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_AUTH_API_URL is not set");
  }
  return base.replace(/\/$/, "");
}

function authApiBase(): string {
  return `${normalizeApiBase()}/auth`;
}

type Mode = "login" | "register";

export default function UsersPage() {
  const router = useRouter();
  const authApi = useMemo(() => authApiBase(), []);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Ready.");

  function saveToken(nextToken: string) {
    if (!nextToken) {
      window.localStorage.removeItem("yomu_auth_access_token");
      return;
    }
    window.localStorage.setItem("yomu_auth_access_token", nextToken);
  }

  async function callAuth(path: string, init: RequestInit = {}): Promise<AuthResponse> {
    const response = await fetch(`${authApi}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
    });

    const raw = await response.text();
    let payload: AuthResponse | string = {};

    if (raw) {
      try {
        payload = JSON.parse(raw) as AuthResponse;
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
      throw new Error(`${response.status} ${detail}`);
    }

    return typeof payload === "string" ? { message: payload } : payload;
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem("yomu_auth_access_token");
    if (savedToken) {
      router.replace("/users/account");
    }
  }, [router]);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    setStatus("Requesting Google login URL...");
    try {
      const redirectTo = `${window.location.origin}/users/account`;
      const result = await callAuth(`/sso/google/url?redirectTo=${encodeURIComponent(redirectTo)}`, {
        method: "GET",
      });

      if (result.authorizationUrl) {
        window.open(result.authorizationUrl, "_self");
        return;
      }

      setStatus(result.message || "Google auth URL generated.");
    } catch (err) {
      setError(String(err));
      setStatus("Failed to request Google login URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(mode === "login" ? "Signing in..." : "Creating account...");

    try {
      const result =
        mode === "login"
          ? await callAuth("/login", {
              method: "POST",
              body: JSON.stringify({
                identifier: email.trim(),
                password,
              }),
            })
          : await callAuth("/register", {
              method: "POST",
              body: JSON.stringify({
                email: email.trim(),
                password,
                username: username.trim() || undefined,
                displayName: displayName.trim() || undefined,
              }),
            });

      const accessToken = result.accessToken || result.access_token || "";
      if (accessToken) {
        saveToken(accessToken);
        setStatus("Login successful. Redirecting...");
        router.replace("/users/account");
      } else {
        setStatus(result.message || "Success. No token returned yet.");
      }
    } catch (err) {
      setError(String(err));
      setStatus(mode === "login" ? "Login failed." : "Register failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">{mode === "login" ? "LOGIN" : "REGISTER"}</p>
        <h1 className="title">{mode === "login" ? "Welcome Back" : "Create Account"}</h1>
        <p className="subtitle">Sign in with Google or continue with email.</p>

        <button type="button" className="google-btn" onClick={() => void handleGoogleLogin()} disabled={loading}>
          <span className="google-icon">G</span>
          <span>{mode === "login" ? "Login with Google" : "Register with Google"}</span>
        </button>

        <div className="divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="form">
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="password" className="label">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="********"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {mode === "register" && (
            <>
              <label htmlFor="username" className="label">
                Username (optional)
              </label>
              <input
                id="username"
                type="text"
                className="input"
                placeholder="your_username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />

              <label htmlFor="displayName" className="label">
                Display Name (optional)
              </label>
              <input
                id="displayName"
                type="text"
                className="input"
                placeholder="Your Name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="switch-mode">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="switch-link"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
            disabled={loading}
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </p>

        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="status-bar">
        <span>{status}</span>
      </div>

      <style jsx>{`
        .auth-shell {
          max-width: 760px;
          margin: 16px auto;
          border: 1px solid #c7c8cf;
          border-radius: 18px;
          background: #f3f4f6;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .auth-card {
          padding: 30px 32px 26px;
        }

        .eyebrow {
          margin: 0;
          letter-spacing: 0.28em;
          color: #1d4ed8;
          font-size: 24px;
          font-weight: 700;
        }

        .title {
          margin: 14px 0 10px;
          font-size: clamp(42px, 6vw, 62px);
          font-weight: 800;
          line-height: 1.05;
          color: #020617;
        }

        .subtitle {
          margin: 0 0 24px;
          font-size: 38px;
          color: #334155;
          line-height: 1.25;
        }

        .google-btn {
          width: 100%;
          height: 64px;
          border-radius: 16px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #0f172a;
          font-size: 38px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .google-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .google-icon {
          font-weight: 800;
          width: 34px;
          display: inline-flex;
          justify-content: center;
        }

        .divider {
          margin: 24px 0 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          color: #475569;
          font-size: 30px;
        }

        .divider::before,
        .divider::after {
          content: "";
          flex: 1;
          border-top: 1px solid #c4c7ce;
        }

        .form {
          display: grid;
          gap: 11px;
        }

        .label {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #1e3a8a;
          font-size: 30px;
          margin-top: 8px;
        }

        .input {
          width: 100%;
          height: 70px;
          border-radius: 16px;
          border: 1px solid #cfd3da;
          background: #ffffff;
          padding: 0 20px;
          font-size: 38px;
          color: #1f2937;
          outline: none;
        }

        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
        }

        .submit-btn {
          margin-top: 16px;
          width: 100%;
          height: 72px;
          border-radius: 16px;
          border: 1px solid #020617;
          background: #020617;
          color: #ffffff;
          font-size: 42px;
          font-weight: 800;
          cursor: pointer;
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .switch-mode {
          text-align: center;
          color: #334155;
          font-size: 36px;
          margin: 24px 0 8px;
        }

        .switch-link {
          border: none;
          background: transparent;
          color: #2563eb;
          font-size: inherit;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .error-text {
          margin: 8px 0 0;
          color: #dc2626;
          font-size: 26px;
          word-break: break-word;
        }

        .status-bar {
          border-top: 1px solid #c7c8cf;
          padding: 12px 20px;
          color: #0f172a;
          font-size: 28px;
          background: #f3f4f6;
        }

        @media (max-width: 900px) {
          .auth-shell {
            margin: 10px 0;
            border-radius: 14px;
          }

          .auth-card {
            padding: 18px 16px 14px;
          }

          .eyebrow {
            font-size: 12px;
          }

          .title {
            font-size: 56px;
          }

          .subtitle {
            font-size: 33px;
            margin-bottom: 18px;
          }

          .google-btn {
            height: 56px;
            font-size: 26px;
            border-radius: 12px;
          }

          .divider {
            font-size: 20px;
            margin: 18px 0 12px;
          }

          .label {
            font-size: 12px;
          }

          .input {
            height: 54px;
            font-size: 30px;
            border-radius: 12px;
          }

          .submit-btn {
            height: 58px;
            font-size: 34px;
            border-radius: 12px;
          }

          .switch-mode {
            font-size: 24px;
            margin-top: 18px;
          }

          .error-text {
            font-size: 14px;
          }

          .status-bar {
            font-size: 16px;
            padding: 10px 14px;
          }
        }
      `}</style>
    </section>
  );
}
