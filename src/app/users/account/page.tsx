"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { changePassword, normalizeAuthError } from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";

function supportsPasswordAuth(authProvider?: string) {
  return (authProvider || "").toUpperCase().includes("PASSWORD");
}

export default function AccountPage() {
  const { session, status, refreshSession } = useAuth();
  const profile = session?.profile;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const hasPasswordAuth = useMemo(
    () => supportsPasswordAuth(profile?.authProvider),
    [profile?.authProvider]
  );

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    if (hasPasswordAuth && !currentPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await changePassword({
        currentPassword: hasPasswordAuth ? currentPassword : undefined,
        newPassword,
      });
      await refreshSession();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(response.message || "Password updated successfully.");
    } catch (error) {
      setPasswordError(normalizeAuthError(error, "password"));
    } finally {
      setSavingPassword(false);
    }
  }

  if (status === "loading") {
    return <LoadingState message="Loading your account..." />;
  }

  return (
    <ProtectedRoute description="Sign in to manage your account settings.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Account Settings</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              {profile?.displayName || profile?.username || "Your Account"}
            </h1>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Profile Summary */}
            <Card variant="raised" padding="lg">
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <Avatar name={profile?.displayName || profile?.username} size="lg" />
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                    {profile?.displayName || profile?.username || "User"}
                  </h2>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {profile?.email || "No email"}
                  </p>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
                    {profile?.role && <Badge variant="brand">{profile.role}</Badge>}
                    <Badge variant={profile?.isActive ? "success" : "danger"}>
                      {profile?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Info */}
            <Card>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Account Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
                {[
                  { label: "Email", value: profile?.email },
                  { label: "Phone", value: profile?.phone },
                  { label: "Username", value: profile?.username },
                  { label: "Auth Provider", value: profile?.authProvider },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-soft)", fontWeight: 600 }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: "0.25rem", fontWeight: 600, wordBreak: "break-word" }}>
                      {item.value || "-"}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Password Section */}
            <Card>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                {hasPasswordAuth ? "Change Password" : "Set Password"}
              </h3>
              <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {hasPasswordAuth
                  ? "Enter your current password to choose a new one."
                  : "You signed in with Google. Set a password so you can also log in manually."}
              </p>

              <form onSubmit={(e) => { e.preventDefault(); void handlePasswordSubmit(e); }} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                {hasPasswordAuth && (
                  <Input
                    label="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                  />
                )}

                <Input
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />

                <Input
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                />

                {passwordError && <div className="auth-error">{passwordError}</div>}
                {passwordMessage && <div className="auth-success">{passwordMessage}</div>}

                <Button type="submit" variant="primary" pill loading={savingPassword}>
                  {savingPassword
                    ? hasPasswordAuth
                      ? "Updating password..."
                      : "Setting password..."
                    : hasPasswordAuth
                      ? "Update Password"
                      : "Set Password"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
