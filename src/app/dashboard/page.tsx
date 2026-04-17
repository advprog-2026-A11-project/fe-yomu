"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/auth-client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";

type AdminUser = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
};

export default function DashboardPage() {
  const { session, token, refreshSession, signOut, isAdmin } = useAuth();
  const profile = session?.profile;

  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  const [deletingSelf, setDeletingSelf] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminDisplayNames, setAdminDisplayNames] = useState<Record<string, string>>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  useEffect(() => {
    setUsername(profile?.username || "");
    setDisplayName(profile?.displayName || "");
  }, [profile?.displayName, profile?.username]);

  async function loadAdminUsers() {
    if (!token || !isAdmin) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi("/users"), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      });

      const payload = (await response.json()) as AdminUser[] | { message?: string; error?: string };

      if (!response.ok || !Array.isArray(payload)) {
        const message = Array.isArray(payload)
          ? "Failed to load users"
          : payload.message || payload.error || "Failed to load users";
        throw new Error(message);
      }

      setAdminUsers(payload);
      setAdminDisplayNames(
        payload.reduce<Record<string, string>>((accumulator, user) => {
          if (user.id) {
            accumulator[user.id] = user.displayName || "";
          }
          return accumulator;
        }, {}),
      );
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setAdminLoading(false);
    }
  }

  useEffect(() => {
    if (!isAdmin) {
      setAdminUsers([]);
      setAdminMessage(null);
    }
  }, [isAdmin]);

  const profileRows = [
    { label: "Profile ID", value: profile?.id || "-" },
    { label: "Username", value: profile?.username || "-" },
    { label: "Email", value: profile?.email || "-" },
    { label: "Phone", value: profile?.phone || "-" },
    { label: "Display Name", value: profile?.displayName || "-" },
    { label: "Role", value: profile?.role || "-" },
    { label: "Auth Provider", value: profile?.authProvider || "-" },
    { label: "Google Sub", value: profile?.googleSub || "-" },
    { label: "Active", value: profile?.isActive ? "true" : "false" },
  ];

  async function handleProfileSave() {
    if (!token) {
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await fetch(authApi("/users/me"), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim() || undefined,
          displayName: displayName.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to update profile");
      }

      setProfileMessage(payload.message || "Profile updated.");
      await refreshSession();
    } catch (error) {
      setProfileMessage(String(error));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteOwnAccount() {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Delete your account? This will deactivate your current account access.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingSelf(true);
    setDeleteMessage(null);

    try {
      const response = await fetch(authApi("/users/me"), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to delete account");
      }

      setDeleteMessage("Account deactivated.");
      signOut();
    } catch (error) {
      setDeleteMessage(String(error));
    } finally {
      setDeletingSelf(false);
    }
  }

  async function handleAdminDisplayNameUpdate(userId: string) {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}/displayName`), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: adminDisplayNames[userId] || "",
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to update target display name");
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? { ...user, displayName: adminDisplayNames[userId] || user.displayName }
            : user,
        ),
      );
      setAdminMessage(payload.message || "Target user updated.");
    } catch (error) {
      setAdminMessage(String(error));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminSoftDelete(userId: string) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(
      "Soft delete this user? The account will be deactivated, not hard removed.",
    );

    if (!confirmed) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to soft delete user");
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: false } : user,
        ),
      );
      setAdminMessage("User soft deleted.");
    } catch (error) {
      setAdminMessage(String(error));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminActivate(userId: string) {
    if (!token) {
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}/activate`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json()) as AdminUser | { message?: string };

      if (!response.ok) {
        throw new Error("message" in payload && payload.message
          ? payload.message
          : "Failed to activate user");
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: true } : user,
        ),
      );
      setAdminMessage("User activated.");
    } catch (error) {
      setAdminMessage(String(error));
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <ProtectedRoute description="Sign in to open your dashboard.">
      <section className="dashboard-page">
        <div className="shell dashboard-simple">
          <p className="eyebrow">Dashboard</p>
          <h1 className="dashboard-simple-title">
            {profile?.displayName || profile?.username || "Yomu user"}
          </h1>

          <div className="dashboard-simple-list">
            {profileRows.map((row) => (
              <div key={row.label}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>

          <section className="dashboard-simple-section">
            <p className="eyebrow">Update profile</p>
            <form
              className="dashboard-simple-form"
              onSubmit={(event) => {
                event.preventDefault();
                void handleProfileSave();
              }}
            >
              <label className="field">
                <span>Username</span>
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Username"
                />
              </label>

              <label className="field">
                <span>Display Name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Display name"
                />
              </label>

              {profileMessage ? <p className="form-feedback">{profileMessage}</p> : null}

              <button type="submit" className="button button-primary" disabled={savingProfile}>
                {savingProfile ? "Saving..." : "Save profile"}
              </button>
            </form>
          </section>

          <section className="dashboard-simple-section">
            <p className="eyebrow">Danger zone</p>
            {deleteMessage ? <p className="form-feedback">{deleteMessage}</p> : null}
            <button
              type="button"
              className="button button-ghost"
              disabled={deletingSelf}
              onClick={() => void handleDeleteOwnAccount()}
            >
              {deletingSelf ? "Deleting..." : "Delete / deactivate my account"}
            </button>
          </section>

          {isAdmin ? (
            <section className="dashboard-simple-section">
              <p className="eyebrow">Admin actions</p>
              {adminMessage ? <p className="form-feedback">{adminMessage}</p> : null}

              <div className="dashboard-admin-list">
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={adminLoading}
                  onClick={() => void loadAdminUsers()}
                >
                  {adminLoading ? "Loading users..." : "Load users"}
                </button>

                {!adminLoading && adminUsers.length === 0 ? (
                  <p className="muted-copy">Load users first to manage other accounts.</p>
                ) : null}

                {adminUsers.map((user) => (
                  <div key={user.id} className="dashboard-admin-item">
                    <div className="dashboard-admin-meta">
                      <strong>{user.displayName || user.username || user.email || "User"}</strong>
                      <span>
                        {user.email || "-"} · {user.role || "-"} ·{" "}
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <label className="field">
                      <span>Display Name</span>
                      <input
                        value={user.id ? adminDisplayNames[user.id] || "" : ""}
                        onChange={(event) => {
                          const currentUserId = user.id;
                          if (!currentUserId) {
                            return;
                          }

                          setAdminDisplayNames((current) => ({
                            ...current,
                            [currentUserId]: event.target.value,
                          }));
                        }}
                      />
                    </label>

                    <div className="home-actions dashboard-admin-actions">
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={adminLoading || !user.id}
                        onClick={() =>
                          user.id && void handleAdminDisplayNameUpdate(user.id)
                        }
                      >
                        Update name
                      </button>
                      <button
                        type="button"
                        className="button button-ghost"
                        disabled={adminLoading || !user.id || user.id === profile?.id}
                        onClick={() => user.id && void handleAdminSoftDelete(user.id)}
                      >
                        Soft delete
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        disabled={adminLoading || !user.id || user.isActive}
                        onClick={() => user.id && void handleAdminActivate(user.id)}
                      >
                        Activate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </ProtectedRoute>
  );
}
