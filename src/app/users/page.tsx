"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

type UserProfile = {
  id: number;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
};

type UserForm = {
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
};

type LoginResponse = {
  accessToken?: string;
  access_token?: string;
  message?: string;
};

function normalizeApiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8081/api";
  return base.replace(/\/$/, "");
}

function buildUsersApiBase(): string {
  return `${normalizeApiBase()}/users`;
}

function buildAuthApiBase(): string {
  return `${normalizeApiBase()}/auth`;
}

const emptyForm: UserForm = {
  username: "",
  displayName: "",
  role: "USER",
  isActive: true,
};

export default function UsersPage() {
  const api = useMemo(() => buildUsersApiBase(), []);
  const authApi = useMemo(() => buildAuthApiBase(), []);
  const [token, setToken] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerDisplayName, setRegisterDisplayName] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [authResult, setAuthResult] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("yomu_auth_access_token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const withAuthHeader = useCallback(
    (init: RequestInit = {}): RequestInit => {
      if (!token) {
        return init;
      }
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);
      return {
        ...init,
        headers,
      };
    },
    [token]
  );

  function saveToken(newToken: string) {
    setToken(newToken);
    if (newToken) {
      window.localStorage.setItem("yomu_auth_access_token", newToken);
    } else {
      window.localStorage.removeItem("yomu_auth_access_token");
    }
  }

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        api,
        withAuthHeader({
          cache: "no-store",
        })
      );
      if (!res.ok) {
        throw new Error(`Gagal ambil data users: ${res.status} ${await res.text()}`);
      }
      const data: UserProfile[] = await res.json();
      setUsers(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [api, withAuthHeader]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function submitForm() {
    setError(null);
    setInfo(null);

    if (!form.username.trim()) {
      setError("Username wajib diisi");
      return;
    }

    try {
      const payload = {
        username: form.username.trim(),
        displayName: form.displayName.trim(),
        role: form.role.trim() || "USER",
        isActive: form.isActive,
      };

      const isEdit = editingId !== null;
      const targetUrl = isEdit ? `${api}/${editingId}` : api;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(targetUrl, {
        ...withAuthHeader({
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
      });

      if (!res.ok) {
        throw new Error(`Gagal simpan user: ${res.status} ${await res.text()}`);
      }

      setInfo(isEdit ? "User berhasil diupdate." : "User berhasil ditambahkan.");
      resetForm();
      await loadUsers();
    } catch (e) {
      setError(String(e));
    }
  }

  function startEdit(user: UserProfile) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      displayName: user.displayName || "",
      role: user.role || "USER",
      isActive: user.isActive,
    });
  }

  async function deleteUser(id: number) {
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`${api}/${id}`, {
        ...withAuthHeader({
          method: "DELETE",
        }),
      });

      if (!res.ok) {
        throw new Error(`Gagal hapus user: ${res.status} ${await res.text()}`);
      }

      setInfo("User berhasil dihapus.");
      if (editingId === id) {
        resetForm();
      }
      await loadUsers();
    } catch (e) {
      setError(String(e));
    }
  }

  async function callAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${authApi}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });

    const rawText = await res.text();
    let payload: unknown = null;
    if (rawText) {
      try {
        payload = JSON.parse(rawText);
      } catch {
        payload = rawText;
      }
    }

    if (!res.ok) {
      throw new Error(`${res.status} ${typeof payload === "string" ? payload : JSON.stringify(payload)}`);
    }

    return payload as T;
  }

  async function login() {
    setAuthLoading(true);
    setAuthResult(null);
    setError(null);
    try {
      const response = await callAuth<LoginResponse>("/login", {
        method: "POST",
        body: JSON.stringify({
          identifier,
          password,
        }),
      });
      const newToken = response.accessToken || response.access_token || "";
      if (newToken) {
        saveToken(newToken);
      }
      setAuthResult(response.message || "Login success");
      await loadUsers();
    } catch (e) {
      setError(String(e));
    } finally {
      setAuthLoading(false);
    }
  }

  async function register() {
    setAuthLoading(true);
    setAuthResult(null);
    setError(null);
    try {
      const response = await callAuth<LoginResponse>("/register", {
        method: "POST",
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          username: registerUsername || undefined,
          displayName: registerDisplayName || undefined,
        }),
      });
      const newToken = response.accessToken || response.access_token || "";
      if (newToken) {
        saveToken(newToken);
      }
      setAuthResult(response.message || "Register success");
      await loadUsers();
    } catch (e) {
      setError(String(e));
    } finally {
      setAuthLoading(false);
    }
  }

  async function me() {
    setAuthLoading(true);
    setAuthResult(null);
    setError(null);
    try {
      const payload = await callAuth<Record<string, unknown>>("/me", {
        method: "GET",
      });
      setAuthResult(JSON.stringify(payload, null, 2));
    } catch (e) {
      setError(String(e));
    } finally {
      setAuthLoading(false);
    }
  }

  async function googleSsoUrl() {
    setAuthLoading(true);
    setAuthResult(null);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/users`;
      const payload = await callAuth<{ authorizationUrl?: string; message?: string }>(
        `/sso/google/url?redirectTo=${encodeURIComponent(redirectTo)}`,
        {
          method: "GET",
        }
      );
      if (payload.authorizationUrl) {
        window.open(payload.authorizationUrl, "_blank", "noopener,noreferrer");
      }
      setAuthResult(payload.message || payload.authorizationUrl || "Google SSO URL generated");
    } catch (e) {
      setError(String(e));
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <section>
      <div className="card" style={{ marginTop: 12, marginBottom: 18 }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Auth Playground Integration Test</h2>
        <p style={{ marginBottom: 8, color: "var(--muted)" }}>
          Frontend target API base: <code>{normalizeApiBase()}</code>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          <label htmlFor="tokenField">Access Token (for /me and /users protected endpoints)</label>
          <textarea
            id="tokenField"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            placeholder="Paste access token from login/register here"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={() => saveToken(token)} disabled={authLoading}>
              Save Token
            </button>
            <button type="button" className="btn" onClick={() => saveToken("")} disabled={authLoading}>
              Clear Token
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
          <label htmlFor="identifier">Login Identifier (email)</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com"
          />
          <label htmlFor="loginPassword">Login Password</label>
          <input
            id="loginPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={() => void login()} disabled={authLoading}>
              Login
            </button>
            <button type="button" className="btn" onClick={() => void me()} disabled={authLoading}>
              Call /auth/me
            </button>
            <button type="button" className="btn" onClick={() => void googleSsoUrl()} disabled={authLoading}>
              Google SSO URL
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginTop: 12 }}>
          <label htmlFor="regEmail">Register Email</label>
          <input
            id="regEmail"
            type="text"
            value={registerEmail}
            onChange={(e) => setRegisterEmail(e.target.value)}
            placeholder="new@example.com"
          />
          <label htmlFor="regPassword">Register Password</label>
          <input
            id="regPassword"
            type="password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            placeholder="minimum 8 chars"
          />
          <label htmlFor="regUsername">Register Username (optional)</label>
          <input
            id="regUsername"
            type="text"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
            placeholder="newuser"
          />
          <label htmlFor="regDisplayName">Register Display Name (optional)</label>
          <input
            id="regDisplayName"
            type="text"
            value={registerDisplayName}
            onChange={(e) => setRegisterDisplayName(e.target.value)}
            placeholder="New User"
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={() => void register()} disabled={authLoading}>
              Register
            </button>
          </div>
        </div>

        {authResult && (
          <pre
            style={{
              marginTop: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: 6,
              padding: 10,
            }}
          >
            {authResult}
          </pre>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
          User Profile Integration Test
        </h2>
        <button type="button" className="btn" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      <form
        className="card"
        style={{ marginTop: 12, marginBottom: 18 }}
        onSubmit={(e) => {
          e.preventDefault();
          void submitForm();
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div>
            <label htmlFor="username" style={{ display: "block", marginBottom: 4 }}>
              Username
            </label>
            <input
              id="username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              required
              type="text"
            />
          </div>
          <div>
            <label htmlFor="displayName" style={{ display: "block", marginBottom: 4 }}>
              Display Name
            </label>
            <input
              id="displayName"
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              type="text"
            />
          </div>
          <div>
            <label htmlFor="role" style={{ display: "block", marginBottom: 4 }}>
              Role
            </label>
            <input
              id="role"
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              type="text"
            />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              type="checkbox"
            />
            <span>isActive</span>
          </label>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button type="submit" className="btn">
            {editingId === null ? "Create" : "Update"}
          </button>
          <button type="button" className="btn" onClick={resetForm}>
            Clear
          </button>
        </div>
      </form>

      {loading && <p>Loading users...</p>}
      {error && <p style={{ color: "var(--danger)" }}>Error: {error}</p>}
      {info && <p>{info}</p>}

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>All User Profiles</h3>
        {users.length === 0 && !loading && <p>Belum ada data user profile.</p>}
        {users.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Id</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>username</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>displayName</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>role</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>isActive</th>
                <th style={{ textAlign: "left", padding: "8px 6px" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px" }}>{user.id}</td>
                  <td style={{ padding: "8px 6px" }}>{user.username}</td>
                  <td style={{ padding: "8px 6px" }}>{user.displayName || "-"}</td>
                  <td style={{ padding: "8px 6px" }}>{user.role || "-"}</td>
                  <td style={{ padding: "8px 6px" }}>{user.isActive ? "true" : "false"}</td>
                  <td style={{ padding: "8px 6px", display: "flex", gap: 8 }}>
                    <button type="button" className="btn" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                    <button type="button" className="btn-danger" onClick={() => void deleteUser(user.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
