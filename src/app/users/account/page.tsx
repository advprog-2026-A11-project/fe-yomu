"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type MeResponse = {
  sub?: string;
  exp?: string;
  profile?: {
    id?: string;
    supabaseUserId?: string;
    username?: string;
    email?: string;
    phone?: string;
    displayName?: string;
    role?: string;
    authProvider?: string;
    googleSub?: string;
    isActive?: boolean;
  } | null;
};

type SsoCallbackResponse = {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  isLinked?: boolean;
  message?: string;
};

type AdminPingResponse = {
  message?: string;
  userId?: string;
};

type AdminUser = {
  id?: string;
  username?: string;
  email?: string;
  supabaseUserId?: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
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
  const searchParams = useSearchParams();
  const authMeUrl = useMemo(() => `${normalizeApiBase()}/auth/me`, []);
  const [token, setToken] = useState<string>("");
  const [account, setAccount] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState(false);

  const [handlingSso, setHandlingSso] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminEditDisplayName, setAdminEditDisplayName] = useState<Record<string, string>>({});

  const isAdmin = account?.profile?.role === "ADMIN";

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

    setAccount(typeof payload === "string" ? {} : payload);
    if (typeof payload !== "string" && payload.profile) {
      setEditUsername(payload.profile.username || "");
      setEditDisplayName(payload.profile.displayName || "");
    }
  }, [authMeUrl]);

  const fetchAdminUsers = useCallback(async (currentToken: string) => {
    const response = await fetch(`${normalizeApiBase()}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
      cache: "no-store",
    });

    const raw = await response.text();
    let payload: AdminUser[] | Record<string, unknown> | string = [];
    if (raw) {
      try {
        payload = JSON.parse(raw) as AdminUser[] | Record<string, unknown>;
      } catch {
        payload = raw;
      }
    }

    if (!response.ok) {
      const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
      throw new Error(`${response.status} ${detail}`);
    }

    const users = Array.isArray(payload) ? payload : [];
    setAdminUsers(users);
    setAdminEditDisplayName(
      users.reduce<Record<string, string>>((acc, user) => {
        if (user.id) {
          acc[user.id] = user.displayName || "";
        }
        return acc;
      }, {}),
    );
  }, []);

  useEffect(() => {
    async function handleSsoCallback(code: string, state: string) {
      setHandlingSso(true);
      setLoading(true);
      try {
        const res = await fetch(`${normalizeApiBase()}/auth/sso/google/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state }),
        });

        const raw = await res.text();
        let data: SsoCallbackResponse = {};
        if (raw) {
          try { data = JSON.parse(raw); } catch { data = { message: raw }; }
        }

        if (!res.ok || !data.accessToken) {
          const msg = data.message || `SSO failed: ${res.status}`;
          setError(msg);
          router.replace("/users");
          return;
        }

        window.localStorage.setItem("yomu_auth_access_token", data.accessToken!);
        setToken(data.accessToken!);
        await fetchMe(data.accessToken!);
        
        if (data.isLinked) {
          setUpdateMsg("Account linked with Google!");
        } else {
          setUpdateMsg("Google login successful!");
        }
      } catch (err) {
        setError(String(err));
        router.replace("/users");
      } finally {
        setHandlingSso(false);
        setLoading(false);
      }
    }

    const code = searchParams.get("code");
    const appState = searchParams.get("app_state");
    const state = searchParams.get("state");
    const callbackState = appState || state;
    const oauthError = searchParams.get("error");
    const oauthErrorCode = searchParams.get("error_code");
    const oauthErrorDescription = searchParams.get("error_description");

    if (oauthError || oauthErrorCode || oauthErrorDescription) {
      const parts = [
        oauthErrorDescription,
        oauthErrorCode,
        oauthError,
      ].filter(Boolean);
      setError(parts.join(" | "));
      setLoading(false);
      return;
    }

    if (code && callbackState) {
      void handleSsoCallback(code, callbackState);
      return;
    }

    if (code && !callbackState) {
      setError("Missing OAuth callback state");
      setLoading(false);
      return;
    }

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
  }, [fetchMe, router, searchParams]);

  useEffect(() => {
    if (!token || !isAdmin) {
      setAdminUsers([]);
      setAdminError(null);
      return;
    }

    setAdminLoading(true);
    setAdminError(null);
    void fetchAdminUsers(token)
      .catch((err) => {
        setAdminError(String(err));
      })
      .finally(() => setAdminLoading(false));
  }, [fetchAdminUsers, isAdmin, token]);

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

  async function handleAdminPing() {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);
    setAdminError(null);
    try {
      const response = await fetch(`${normalizeApiBase()}/admin/ping`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const raw = await response.text();
      let payload: AdminPingResponse | Record<string, unknown> | string = {};
      if (raw) {
        try {
          payload = JSON.parse(raw) as AdminPingResponse | Record<string, unknown>;
        } catch {
          payload = raw;
        }
      }

      if (!response.ok) {
        const detail = typeof payload === "string" ? payload : JSON.stringify(payload);
        throw new Error(`${response.status} ${detail}`);
      }

      const data = typeof payload === "string" ? { message: payload } : payload;
      setAdminMessage(`${data.message || "Admin ping ok"} (${data.userId || "-"})`);
    } catch (err) {
      setAdminError(String(err));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminRefreshUsers() {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);
    setAdminError(null);
    try {
      await fetchAdminUsers(token);
      setAdminMessage("User list refreshed");
    } catch (err) {
      setAdminError(String(err));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminDeleteUser(userId: string) {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);
    setAdminError(null);
    try {
      const response = await fetch(`${normalizeApiBase()}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(`${response.status} ${raw}`);
      }

      await fetchAdminUsers(token);
      setAdminMessage(`User ${userId} soft deleted`);
    } catch (err) {
      setAdminError(String(err));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminUpdateDisplayName(userId: string) {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);
    setAdminError(null);
    try {
      const response = await fetch(`${normalizeApiBase()}/users/${userId}/displayName`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          displayName: adminEditDisplayName[userId] || "",
        }),
      });

      const raw = await response.text();
      if (!response.ok) {
        throw new Error(`${response.status} ${raw}`);
      }

      await fetchAdminUsers(token);
      setAdminMessage(`Display name updated for ${userId}`);
    } catch (err) {
      setAdminError(String(err));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    
    setUpdating(true);
    setUpdateMsg(null);
    setUpdateError(false);
    
    try {
      const res = await fetch(`${normalizeApiBase()}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editUsername.trim() || undefined,
          displayName: editDisplayName.trim() || undefined,
        }),
      });
      
      const raw = await res.text();
      let data: Record<string, string> = {};
      if (raw) {
        try { data = JSON.parse(raw); } catch { data = { message: raw }; }
      }
      
      if (!res.ok) {
        setUpdateError(true);
        setUpdateMsg(data.message || `Error ${res.status}`);
      } else {
        setUpdateMsg(data.message || "Profile updated");
        await fetchMe(token);
      }
    } catch (err) {
      setUpdateError(true);
      setUpdateMsg(String(err));
    } finally {
      setUpdating(false);
    }
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
              <strong>Email:</strong> {account.profile?.email || "-"}
            </p>
            <p>
              <strong>Username:</strong> {account.profile?.username || "-"}
            </p>
            <p>
              <strong>Display Name:</strong> {account.profile?.displayName || "-"}
            </p>
            <p>
              <strong>Phone:</strong> {account.profile?.phone || "-"}
            </p>
            <p>
              <strong>Role:</strong> {account.profile?.role || "-"}
            </p>
            <p>
              <strong>Active:</strong> {account.profile?.isActive ? "true" : "false"}
            </p>
            <p>
              <strong>Auth Provider:</strong> {account.profile?.authProvider || "-"}
            </p>
            <p>
              <strong>Sub:</strong> {account.sub || account.profile?.supabaseUserId || "-"}
            </p>
            <p>
              <strong>Profile ID:</strong> {account.profile?.id || "-"}
            </p>
          </div>
        )}

        {!loading && !error && account && (
          <form onSubmit={(e) => void handleUpdateProfile(e)} className="edit-form">
            <h3>Edit Profile</h3>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="Username"
            />
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="Display Name"
            />
            <button type="submit" disabled={updating}>
              {updating ? "Saving..." : "Save Profile"}
            </button>
            {updateMsg && <p className={updateError ? "error" : "success"}>{updateMsg}</p>}
          </form>
        )}

        {!loading && !error && account && isAdmin && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <h3>Admin Tools</h3>
              <div className="admin-panel-actions">
                <button type="button" onClick={() => void handleAdminPing()} disabled={adminLoading}>
                  Ping Admin
                </button>
                <button type="button" onClick={() => void handleAdminRefreshUsers()} disabled={adminLoading}>
                  Refresh Users
                </button>
              </div>
            </div>

            {adminMessage && <p className="success">{adminMessage}</p>}
            {adminError && <p className="error">{adminError}</p>}
            {adminLoading && <p>Loading admin tools...</p>}

            <div className="admin-users">
              {adminUsers.map((user) => (
                <div key={user.id || user.supabaseUserId} className="admin-user-card">
                  <p><strong>Profile ID:</strong> {user.id || "-"}</p>
                  <p><strong>Supabase User ID:</strong> {user.supabaseUserId || "-"}</p>
                  <p><strong>Email:</strong> {user.email || "-"}</p>
                  <p><strong>Username:</strong> {user.username || "-"}</p>
                  <p><strong>Role:</strong> {user.role || "-"}</p>
                  <p><strong>Active:</strong> {user.isActive ? "true" : "false"}</p>

                  <label htmlFor={`display-name-${user.id}`}>Display Name</label>
                  <input
                    id={`display-name-${user.id}`}
                    type="text"
                    value={user.id ? (adminEditDisplayName[user.id] || "") : ""}
                    onChange={(event) => {
                      if (!user.id) {
                        return;
                      }
                      setAdminEditDisplayName((current) => ({
                        ...current,
                        [user.id!]: event.target.value,
                      }));
                    }}
                  />

                  <div className="admin-user-actions">
                    <button
                      type="button"
                      onClick={() => user.id && void handleAdminUpdateDisplayName(user.id)}
                      disabled={adminLoading || !user.id}
                    >
                      Update Display Name
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => user.id && void handleAdminDeleteUser(user.id)}
                      disabled={adminLoading || !user.id || user.id === account.profile?.id}
                    >
                      Soft Delete User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
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

        .edit-form {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
        }

        .edit-form h3 {
          margin: 0 0 12px;
          font-size: 1.2rem;
        }

        .edit-form label {
          display: block;
          margin: 8px 0 4px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .edit-form input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 1rem;
        }

        .edit-form button {
          margin-top: 12px;
          padding: 8px 16px;
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #fff;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .edit-form button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .success {
          color: #16a34a;
          margin-top: 8px;
        }

        .admin-panel {
          margin-top: 20px;
          padding: 16px;
          border: 1px solid #dbeafe;
          border-radius: 10px;
          background: #eff6ff;
        }

        .admin-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .admin-panel-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .admin-panel-actions {
          display: flex;
          gap: 8px;
        }

        .admin-panel-actions button,
        .admin-user-actions button {
          border: 1px solid #2563eb;
          background: #2563eb;
          color: #fff;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 600;
        }

        .admin-users {
          display: grid;
          gap: 12px;
          margin-top: 12px;
        }

        .admin-user-card {
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          background: #fff;
          padding: 12px;
        }

        .admin-user-card p {
          margin: 4px 0;
          word-break: break-word;
        }

        .admin-user-card label {
          display: block;
          margin: 10px 0 4px;
          font-weight: 600;
          font-size: 0.875rem;
        }

        .admin-user-card input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #93c5fd;
          border-radius: 6px;
          font-size: 1rem;
        }

        .admin-user-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .danger-btn {
          border-color: #dc2626 !important;
          background: #dc2626 !important;
        }
      `}</style>
    </section>
  );
}
