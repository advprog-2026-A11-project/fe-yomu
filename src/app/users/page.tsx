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

function buildUsersApiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:8080/api";
  return `${base.replace(/\/$/, "")}/users`;
}

const emptyForm: UserForm = {
  username: "",
  displayName: "",
  role: "USER",
  isActive: true,
};

export default function UsersPage() {
  const api = useMemo(() => buildUsersApiBase(), []);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(api, { cache: "no-store" });
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
  }, [api]);

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
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        method: "DELETE",
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

  return (
    <section>
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
