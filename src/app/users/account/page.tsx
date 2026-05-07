"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingState } from "@/components/states/loading-state";
import { useAuth } from "@/components/providers/auth-provider";
import { changePassword, normalizeAuthError } from "@/lib/auth-client";

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
    [profile?.authProvider],
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
    return <LoadingState title="Loading your account" description="Preparing your account settings." />;
  }

  return (
    <ProtectedRoute
      title="Account access required"
      description="Sign in to manage your account and password settings."
    >
      <div className="shell dashboard-simple">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Account</p>
              <h1>{profile?.displayName || profile?.username || "Your account"}</h1>
              <p>Manage your login methods and keep your Yomu account secure.</p>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-card">
              <span className="profile-label">Email</span>
              <strong>{profile?.email || "-"}</strong>
            </div>
            <div className="profile-card">
              <span className="profile-label">Phone</span>
              <strong>{profile?.phone || "-"}</strong>
            </div>
            <div className="profile-card">
              <span className="profile-label">Username</span>
              <strong>{profile?.username || "-"}</strong>
            </div>
            <div className="profile-card">
              <span className="profile-label">Auth Provider</span>
              <strong>{profile?.authProvider || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-eyebrow">Password</p>
              <h2>{hasPasswordAuth ? "Change password" : "Set password"}</h2>
              <p>
                {hasPasswordAuth
                  ? "Enter your current password to choose a new one."
                  : "You signed in with Google. Set a password now so you can also log in manually."}
              </p>
            </div>
          </div>

          <form className="auth-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
            {hasPasswordAuth ? (
              <label className="field">
                <span>Current password</span>
                <input
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  required
                />
              </label>
            ) : null}

            <label className="field">
              <span>New password</span>
              <input
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                required
              />
            </label>

            <label className="field">
              <span>Confirm new password</span>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="Repeat the new password"
                required
              />
            </label>

            {passwordError ? <p className="form-feedback form-feedback-error">{passwordError}</p> : null}
            {passwordMessage ? <p className="form-feedback form-feedback-success">{passwordMessage}</p> : null}

            <button type="submit" className="button button-primary" disabled={savingPassword}>
              {savingPassword
                ? (hasPasswordAuth ? "Updating password..." : "Setting password...")
                : (hasPasswordAuth ? "Update password" : "Set password")}
            </button>
          </form>
        </section>
      </div>
    </ProtectedRoute>
  );
}
