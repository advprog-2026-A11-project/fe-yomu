"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { authApi, extractErrorMessage } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Avatar } from "@/components/ui/Avatar";
import { Tabs } from "@/components/ui/Tabs";

type AdminUser = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  phone?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
};

function getMessageBorderColor(message: string): string {
  return message.includes("Failed") ? "var(--danger)" : "var(--success)";
}

function getMessageColor(message: string): string {
  return message.includes("Failed") ? "var(--danger)" : "var(--success)";
}

function getMessageIcon(message: string): string {
  return message.includes("Failed") ? "⚠️" : "✅";
}

function getEmptyDescription(tab: string): string {
  return `No ${tab} users found.`;
}

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive">("all");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    displayName: string;
    email: string;
    username: string;
    role: string;
  }>({ displayName: "", email: "", username: "", role: "STUDENT" });

  useEffect(() => {
    if (isAdmin) {
      void loadUsers();
    }
  }, [isAdmin]);

  async function loadUsers() {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(authApi("/users"), {
        credentials: "include",
        cache: "no-store",
      });

      const payload = (await response.json()) as AdminUser[] | { message?: string; error?: string };

      if (!response.ok || !Array.isArray(payload)) {
        const msg = Array.isArray(payload)
          ? "Failed to load users"
          : payload.message || payload.error || "Failed to load users";
        throw new Error(msg);
      }

      setUsers(payload);
    } catch (error) {
      setMessage(extractErrorMessage(error, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(userId: string | undefined) {
    if (!userId) return;
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}/activate`), {
        method: "PATCH",
        credentials: "include",
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to activate user");
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: true } : user
        )
      );
      setMessage("User activated successfully.");
    } catch (error) {
      setMessage(extractErrorMessage(error, "Failed to activate user"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(userId: string | undefined) {
    if (!userId) return;
    if (!confirm("Deactivate this user? They will no longer be able to log in.")) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to deactivate user");
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: false } : user
        )
      );
      setMessage("User deactivated successfully.");
    } catch (error) {
      setMessage(extractErrorMessage(error, "Failed to deactivate user"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleUpdate(userId: string | undefined) {
    if (!userId) return;
    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: editForm.username || targetUser.username || "",
          email: editForm.email || targetUser.email || "",
          displayName: editForm.displayName || targetUser.displayName || "",
          role: editForm.role || targetUser.role || "STUDENT",
          isActive: targetUser.isActive ?? true,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message || "Failed to update user");
      }

      setUsers((current) =>
        current.map((user) =>
          user.id === userId
            ? {
                ...user,
                displayName: editForm.displayName || user.displayName,
                email: editForm.email || user.email,
                username: editForm.username || user.username,
                role: editForm.role || user.role,
              }
            : user
        )
      );
      setEditingUserId(null);
      setMessage("User updated successfully.");
    } catch (error) {
      setMessage(extractErrorMessage(error, "Failed to update user"));
    } finally {
      setLoading(false);
    }
  }

  function openEditForm(user: AdminUser) {
    setEditingUserId(user.id || null);
    setEditForm({
      displayName: user.displayName || "",
      email: user.email || "",
      username: user.username || "",
      role: user.role || "STUDENT",
    });
  }

  function cancelEdit() {
    setEditingUserId(null);
    setEditForm({ displayName: "", email: "", username: "", role: "STUDENT" });
  }

  const filteredUsers = users.filter((user) => {
    if (activeTab === "active") return user.isActive;
    if (activeTab === "inactive") return !user.isActive;
    return true;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const inactiveCount = users.filter((u) => !u.isActive).length;

  return (
    <ProtectedRoute description="Sign in to access the admin panel.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="yomu-eyebrow">Admin Panel</p>
              <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                User Management
              </h1>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                Manage all registered users, update roles, and control access.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button variant="primary" pill onClick={() => void loadUsers()} loading={loading}>
                {loading ? "Loading..." : "Load Users"}
              </Button>
              <Link href="/dashboard">
                <Button variant="secondary" pill leftIcon="←">Back to Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div style={{
              background: message.includes("Failed") ? "rgba(220, 38, 38, 0.1)" : "rgba(21, 128, 61, 0.1)",
              border: `1px solid ${getMessageBorderColor(message)}`,
              color: getMessageColor(message),
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1.5rem",
              fontWeight: 600,
            }}>
              {getMessageIcon(message)} {message}
            </div>
          )}

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <Card style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--primary-soft)" }}>{users.length}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Total Users</div>
            </Card>
            <Card style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--success)" }}>{activeCount}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Active</div>
            </Card>
            <Card style={{ textAlign: "center", padding: "1.25rem" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--danger)" }}>{inactiveCount}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>Inactive</div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs
            items={[
              { id: "all", label: `All (${users.length})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "inactive", label: `Inactive (${inactiveCount})` },
            ]}
            active={activeTab}
            onChange={(id) => setActiveTab(id as "all" | "active" | "inactive")}
          />

          {/* User List */}
          <div style={{ marginTop: "1.5rem" }}>
            {loading && users.length === 0 ? (
              <LoadingState message="Loading users..." />
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No Users Found"
                description={activeTab === "all" ? "Click 'Load Users' to fetch the user list." : getEmptyDescription(activeTab)}
              />
            ) : (
              <div style={{ display: "grid", gap: "1rem" }}>
                {filteredUsers.map((user) => (
                  <Card key={user.id} variant="raised" padding="lg">
                    {editingUserId === user.id ? (
                      /* Edit Form */
                      <div style={{ display: "grid", gap: "1rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>Edit User</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
                          <Input
                            label="Display Name"
                            value={editForm.displayName}
                            onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                            placeholder="Display name"
                          />
                          <Input
                            label="Username"
                            value={editForm.username}
                            onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                            placeholder="Username"
                          />
                          <Input
                            label="Email"
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                            placeholder="Email address"
                          />
                          <div>
                            <label style={{ display: "block", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", fontWeight: 600, marginBottom: "0.5rem" }}>
                              Role
                            </label>
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                              style={{
                                width: "100%",
                                padding: "0.75rem 1rem",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--border)",
                                background: "var(--bg)",
                                fontSize: "0.95rem",
                                color: "var(--text)",
                              }}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                          <Button variant="primary" pill onClick={() => handleRoleUpdate(user.id)} loading={loading}>
                            Save Changes
                          </Button>
                          <Button variant="ghost" pill onClick={cancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* User Card */
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "250px" }}>
                          <Avatar name={user.displayName || user.username} size="lg" />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>
                              {user.displayName || user.username || "User"}
                            </div>
                            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                              {user.email || "-"} · {user.phone || "-"}
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                              <Badge variant="brand">{user.role || "STUDENT"}</Badge>
                              <Badge variant={user.isActive ? "success" : "danger"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <Button variant="secondary" size="sm" pill onClick={() => openEditForm(user)}>
                            Edit
                          </Button>
                          {user.isActive ? (
                            <Button variant="danger" size="sm" pill onClick={() => handleDeactivate(user.id)}>
                              Deactivate
                            </Button>
                          ) : (
                            <Button variant="success" size="sm" pill onClick={() => user.id && void handleActivate(user.id)}>
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
