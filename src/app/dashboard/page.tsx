"use client";

import { useEffect, useState } from "react";
import { authApi, extractErrorMessage } from "@/lib/auth-client";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROUTES } from "@/constants";

type AdminUser = {
  id?: string;
  username?: string;
  email?: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
};

function ProfileSection() {
  const { session, refreshSession, signOut, isAuthenticated } = useAuth();
  const profile = session?.profile;

  const [username, setUsername] = useState(profile?.username || "");
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [deletingSelf, setDeletingSelf] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    setUsername(profile?.username || "");
    setDisplayName(profile?.displayName || "");
  }, [profile?.displayName, profile?.username]);

  async function handleProfileSave() {
    if (!isAuthenticated) return;

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await fetch(authApi("/users/me"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
      setProfileMessage(extractErrorMessage(error, "Failed to update profile"));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleDeleteOwnAccount() {
    if (!isAuthenticated) return;

    const confirmed = window.confirm(
      "Delete your account? This will deactivate your current account access."
    );

    if (!confirmed) return;

    setDeletingSelf(true);
    setDeleteMessage(null);

    try {
      const response = await fetch(authApi("/users/me"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmation: "DELETE" }),
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(extractErrorMessage(raw, "Failed to delete account"));
      }

      setDeleteMessage("Account deactivated.");
      await signOut();
    } catch (error) {
      setDeleteMessage(extractErrorMessage(error, "Failed to delete account"));
    } finally {
      setDeletingSelf(false);
    }
  }

  const profileRows = [
    { label: "Profile ID", value: profile?.id || "-" },
    { label: "Username", value: profile?.username || "-" },
    { label: "Email", value: profile?.email || "-" },
    { label: "Phone", value: profile?.phone || "-" },
    { label: "Role", value: profile?.role || "-" },
    { label: "Status", value: profile?.isActive ? "Active" : "Inactive" },
  ];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* Profile Hero */}
      <Card variant="raised" padding="lg">
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Avatar name={profile?.displayName || profile?.username} size="xl" />
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              {profile?.displayName || profile?.username || "User"}
            </h2>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)" }}>
              {profile?.email || "No email"}
            </p>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {profile?.role && <Badge variant="brand">{profile.role}</Badge>}
              {profile?.isActive ? (
                <Badge variant="success">Active</Badge>
              ) : (
                <Badge variant="danger">Inactive</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Info */}
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Profile Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
          {profileRows.map((row) => (
            <div key={row.label}>
              <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", fontWeight: 600 }}>
                {row.label}
              </div>
              <div style={{ marginTop: "0.25rem", fontWeight: 600, wordBreak: "break-word" }}>
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Edit Profile */}
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Edit Profile</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleProfileSave();
          }}
          style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}
        >
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Display name"
          />

          {profileMessage && (
            <div className={profileMessage.includes("Failed") ? "auth-error" : "auth-success"}>
              {profileMessage}
            </div>
          )}

          <Button type="submit" variant="primary" pill loading={savingProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      {/* Quick Links */}
      <Card>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Quick Links</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <a href={ROUTES.reading.student} style={{ textDecoration: "none" }}>
            <Button variant="secondary" pill>📖 Reading</Button>
          </a>
          <a href={ROUTES.forum} style={{ textDecoration: "none" }}>
            <Button variant="secondary" pill>💬 Forum</Button>
          </a>
          <a href={ROUTES.achievement} style={{ textDecoration: "none" }}>
            <Button variant="secondary" pill>🏆 Achievements</Button>
          </a>
          <a href={ROUTES.clan.list} style={{ textDecoration: "none" }}>
            <Button variant="secondary" pill>⚔️ League</Button>
          </a>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card variant="pressed">
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--danger)" }}>
          Danger Zone
        </h3>
        <p style={{ margin: "0 0 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Once you delete your account, there is no going back.
        </p>
        {deleteMessage && (
          <div className={deleteMessage.includes("Failed") ? "auth-error" : "auth-success"}>
            {deleteMessage}
          </div>
        )}
        <Button variant="danger" pill loading={deletingSelf} onClick={() => void handleDeleteOwnAccount()}>
          {deletingSelf ? "Deleting..." : "Delete Account"}
        </Button>
      </Card>
    </div>
  );
}

function AdminPanel() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminDisplayNames, setAdminDisplayNames] = useState<Record<string, string>>({});
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  async function loadAdminUsers() {
    if (!isAuthenticated || !isAdmin) return;

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi("/users"), {
        credentials: "include",
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
        payload.reduce<Record<string, string>>((acc, user) => {
          if (user.id) acc[user.id] = user.displayName || "";
          return acc;
        }, {})
      );
    } catch (error) {
      setAdminMessage(extractErrorMessage(error, "Failed to load users"));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminDisplayNameUpdate(userId: string) {
    if (!isAuthenticated) return;

    const targetUser = adminUsers.find((user) => user.id === userId);
    if (!targetUser) {
      setAdminMessage("Target user not found.");
      return;
    }

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: targetUser.username || "",
          email: targetUser.email || "",
          displayName: adminDisplayNames[userId] || "",
          role: targetUser.role || "STUDENT",
          isActive: targetUser.isActive ?? true,
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
            : user
        )
      );
      setAdminMessage(payload.message || "Target user updated.");
    } catch (error) {
      setAdminMessage(extractErrorMessage(error, "Failed to update target display name"));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminSoftDelete(userId: string) {
    if (!isAuthenticated) return;

    const confirmed = window.confirm("Soft delete this user? The account will be deactivated.");
    if (!confirmed) return;

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const raw = await response.text();
        throw new Error(raw || "Failed to soft delete user");
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: false } : user
        )
      );
      setAdminMessage("User soft deleted.");
    } catch (error) {
      setAdminMessage(extractErrorMessage(error, "Failed to soft delete user"));
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleAdminActivate(userId: string) {
    if (!isAuthenticated) return;

    setAdminLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch(authApi(`/users/${userId}/activate`), {
        method: "PATCH",
        credentials: "include",
      });

      const payload = (await response.json()) as AdminUser | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in payload && payload.message ? payload.message : "Failed to activate user"
        );
      }

      setAdminUsers((current) =>
        current.map((user) =>
          user.id === userId ? { ...user, isActive: true } : user
        )
      );
      setAdminMessage("User activated.");
    } catch (error) {
      setAdminMessage(String(error));
    } finally {
      setAdminLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>User Management</h3>
          <Button variant="primary" size="sm" pill loading={adminLoading} onClick={() => void loadAdminUsers()}>
            {adminLoading ? "Loading..." : "Load Users"}
          </Button>
        </div>

        {adminMessage && (
          <div className={adminMessage.includes("Failed") ? "auth-error" : "auth-success"}>
            {adminMessage}
          </div>
        )}

        {!adminLoading && adminUsers.length === 0 && (
          <EmptyState
            icon="👥"
            title="No Users Loaded"
            description="Click 'Load Users' to fetch the user list."
          />
        )}

        {adminUsers.length > 0 && (
          <div style={{ display: "grid", gap: "1rem" }}>
            {adminUsers.map((user) => (
              <Card key={user.id} variant="raised" padding="sm">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: "200px" }}>
                    <Avatar name={user.displayName || user.username} size="md" />
                    <div>
                      <div style={{ fontWeight: 700 }}>{user.displayName || user.username || "User"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        {user.email || "-"} · {user.role || "-"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Input
                    value={user.id ? adminDisplayNames[user.id] || "" : ""}
                    onChange={(e) => {
                      const currentUserId = user.id;
                      if (!currentUserId) return;
                      setAdminDisplayNames((current) => ({
                        ...current,
                        [currentUserId]: e.target.value,
                      }));
                    }}
                    placeholder="Display name"
                    size="sm"
                    style={{ flex: 1, minWidth: "180px" }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    pill
                    disabled={adminLoading || !user.id}
                    onClick={() => user.id && void handleAdminDisplayNameUpdate(user.id)}
                  >
                    Update
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    pill
                    disabled={adminLoading || !user.id}
                    onClick={() => user.id && void handleAdminSoftDelete(user.id)}
                  >
                    Soft Delete
                  </Button>
                  {!user.isActive && (
                    <Button
                      variant="success"
                      size="sm"
                      pill
                      disabled={adminLoading || !user.id}
                      onClick={() => user.id && void handleAdminActivate(user.id)}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { session, isAdmin } = useAuth();

  return (
    <ProtectedRoute description="Sign in to open your dashboard.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Dashboard</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              {session?.profile?.displayName || session?.profile?.username || "Your Dashboard"}
            </h1>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
            <ProfileSection />
            {isAdmin && <AdminPanel />}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
