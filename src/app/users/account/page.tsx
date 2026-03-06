"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MeResponse = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: string;
  profile?: {
    id?: number;
    supabaseUserId?: string;
    username?: string;
    email?: string;
    displayName?: string;
    role?: string;
    isActive?: boolean;
  } | null;
};

function normalizeApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_AUTH_API_URL;
  if (!configured) {
    return "/api/auth-proxy";
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:" && configured.startsWith("http://")) {
    return "/api/auth-proxy";
  }
  return configured.replace(/\/$/, "");
}

export default function AccountPage() {
  const router = useRouter();
  const authMeUrl = useMemo(() => `${normalizeApiBase()}/auth/me`, []);
  const [token, setToken] = useState<string>("");
  const [account, setAccount] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMe = useCallback(async (currentToken: string) => {
    const response = await fetch(authMeUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      cache: "no-store",
    });

    const raw = await response.text();
    let payload: MeResponse | string = {};
    if (raw) {
      try {
        payload = JSON.parse(raw) as MeResponse;
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
      throw new Error(`${response.status} ${detail}`);
    }

    setAccount(typeof payload === "string" ? { email: payload } : payload);
  }, [authMeUrl]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("yomu_auth_access_token");
    if (!savedToken) {
      router.replace("/users");
      return;
    }

    setToken(savedToken);
    void fetchMe(savedToken)
      .catch((err) => {
        setError(String(err));
      })
      .finally(() => setLoading(false));
  }, [fetchMe, router]);

  async function refresh() {
    if (!token) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await fetchMe(token);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    window.localStorage.removeItem("yomu_auth_access_token");
    router.replace("/users");
  }

  return (
    <section className="account-shell">
      <div className="account-card">
        <div className="top-row">
          <h1>Account</h1>
          <div className="top-actions">
            <button type="button" onClick={() => void refresh()} disabled={loading}>
              Refresh
            </button>
            <button type="button" className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        {loading && <p>Loading account...</p>}
        {error && <p className="error">Error: {error}</p>}

        {!loading && !error && account && (
          <div className="details">
            <p>
              <strong>Email:</strong> {account.profile?.email || account.email || "-"}
            </p>
            <p>
              <strong>Username:</strong> {account.profile?.username || "-"}
            </p>
            <p>
              <strong>Display Name:</strong> {account.profile?.displayName || "-"}
            </p>
            <p>
              <strong>Role:</strong> {account.profile?.role || account.role || "-"}
            </p>
            <p>
              <strong>Active:</strong> {account.profile?.isActive ? "true" : "false"}
            </p>
            <p>
              <strong>Sub:</strong> {account.sub || account.profile?.supabaseUserId || "-"}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .account-shell {
          max-width: 760px;
          margin: 16px auto;
        }

        .account-card {
          border: 1px solid #d1d5db;
          border-radius: 14px;
          background: #fff;
          padding: 20px;
        }

        .top-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 14px;
        }

        .top-row h1 {
          margin: 0;
          font-size: 1.8rem;
        }

        .top-actions {
          display: flex;
          gap: 8px;
        }

        .top-actions button {
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
        }

        .logout-btn {
          border-color: #fecaca !important;
          color: #b91c1c !important;
        }

        .details {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          background: #f8fafc;
          line-height: 1.6;
        }

        .details p {
          margin: 4px 0;
          word-break: break-word;
        }

        .error {
          color: #dc2626;
        }
      `}</style>
    </section>
  );
}
