"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import {
  changePassword,
  deleteCurrentAccount,
  normalizeAuthError,
  updateCurrentEmail,
  updateCurrentPhone,
  updateCurrentProfile,
} from "@/lib/auth-client";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import type { AuthProfile } from "@/types/auth";

function supportsPasswordAuth(authProvider?: string) {
  return (authProvider || "").toUpperCase().includes("PASSWORD");
}

function getPasswordButtonText(saving: boolean, hasPassword: boolean): string {
  if (saving) {
    return hasPassword ? "Updating password..." : "Setting password...";
  }
  return hasPassword ? "Update Password" : "Set Password";
}

function hasValidPhoneDigitCount(value: string): boolean {
  const compact = value.replaceAll(/[\s\-()+]/g, "");
  return compact.length >= 8 && compact.length <= 15 && /^\d+$/.test(compact);
}

function normalizePhoneInput(value: string): string {
  return value.trim().replaceAll(/[\s\-()]/g, "");
}

export default function AccountPage() {
  const { session, status, isAuthenticated, refreshSession, signOut } = useAuth();
  const profile = session?.profile;

  if (status === "loading") {
    return <LoadingState message="Loading your account..." />;
  }

  const profileKey = [
    profile?.id,
    profile?.username,
    profile?.displayName,
    profile?.email,
    profile?.phone,
    profile?.authProvider,
  ].join(":");

  return (
    <ProtectedRoute description="Sign in to manage your account settings.">
      {isAuthenticated && profile ? (
        <AccountContent
          key={profileKey}
          profile={profile}
          refreshSession={refreshSession}
          signOut={signOut}
        />
      ) : null}
    </ProtectedRoute>
  );
}

function AccountContent({
  profile,
  refreshSession,
  signOut,
}: Readonly<{
  profile: AuthProfile;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
}>) {
  const [username, setUsername] = useState(profile.username || "");
  const [displayName, setDisplayName] = useState(profile.displayName || "");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [email, setEmail] = useState(profile.email || "");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [phone, setPhone] = useState(profile.phone || "");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const hasPasswordAuth = useMemo(
    () => supportsPasswordAuth(profile?.authProvider),
    [profile?.authProvider],
  );

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    const nextUsername = username.trim();
    const nextDisplayName = displayName.trim();
    if (!nextUsername && !nextDisplayName) {
      setProfileError("Username or display name is required.");
      return;
    }

    setProfileSaving(true);
    try {
      const response = await updateCurrentProfile({
        username: nextUsername || undefined,
        displayName: nextDisplayName || undefined,
      });
      await refreshSession();
      setProfileMessage(response.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(normalizeAuthError(error, "profile"));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    setEmailError(null);

    const nextEmail = email.trim();
    if (!nextEmail) {
      setEmailError("Email is required.");
      return;
    }

    setEmailSaving(true);
    try {
      const response = await updateCurrentEmail({ email: nextEmail });
      await refreshSession();
      setEmailMessage(response.message || "Email login method updated successfully.");
    } catch (error) {
      setEmailError(normalizeAuthError(error, "profile"));
    } finally {
      setEmailSaving(false);
    }
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhoneMessage(null);
    setPhoneError(null);

    const nextPhone = normalizePhoneInput(phone);
    if (!hasValidPhoneDigitCount(nextPhone)) {
      setPhoneError("Phone number must contain 8-15 digits.");
      return;
    }

    setPhoneSaving(true);
    try {
      const response = await updateCurrentPhone({ phone: nextPhone });
      await refreshSession();
      setPhone(response.phone || nextPhone);
      setPhoneMessage(response.message || "Phone login method updated successfully.");
    } catch (error) {
      setPhoneError(normalizeAuthError(error, "profile"));
    } finally {
      setPhoneSaving(false);
    }
  }

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

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(null);

    if (deleteConfirmation.trim() !== "DELETE") {
      setDeleteError("Type DELETE to confirm account deletion.");
      return;
    }

    setDeletingAccount(true);
    try {
      await deleteCurrentAccount({ confirmation: deleteConfirmation.trim() });
      await signOut();
    } catch (error) {
      setDeleteError(normalizeAuthError(error, "account"));
      setDeletingAccount(false);
    }
  }

  return (
    <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "760px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Account Settings</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800 }}>
              {profile?.displayName || profile?.username || "Your Account"}
            </h1>
          </div>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            <Card variant="raised" padding="lg">
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                <Avatar name={profile?.displayName || profile?.username} size="lg" />
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
                    {profile?.displayName || profile?.username || "User"}
                  </h2>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {profile?.email || profile?.phone || "No login contact"}
                  </p>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    {profile?.role && <Badge variant="brand">{profile.role}</Badge>}
                    <Badge variant={profile?.isActive ? "success" : "danger"}>
                      {profile?.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Account Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
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

            <Card>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                Public Profile
              </h3>
              <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Update the name shown across Yomu without changing your login token contract.
              </p>

              <form onSubmit={(event) => void handleProfileSubmit(event)} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                <Input
                  label="Username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  type="text"
                  autoComplete="username"
                  placeholder="Choose a username"
                />
                <Input
                  label="Display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  type="text"
                  autoComplete="nickname"
                  placeholder="How Yomu should greet you"
                />

                {profileError && <div className="auth-error">{profileError}</div>}
                {profileMessage && <div className="auth-success">{profileMessage}</div>}

                <Button type="submit" variant="primary" pill loading={profileSaving}>
                  {profileSaving ? "Saving profile..." : "Save Profile"}
                </Button>
              </form>
            </Card>

            <Card>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                Login Methods
              </h3>
              <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                Add email or phone access so the same account can be used with more than one manual login method.
              </p>

              <div style={{ display: "grid", gap: "1.25rem" }}>
                <form onSubmit={(event) => void handleEmailSubmit(event)} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                  <Input
                    label={profile?.email ? "Email" : "Add email"}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="you@yomu.id"
                  />

                  {emailError && <div className="auth-error">{emailError}</div>}
                  {emailMessage && <div className="auth-success">{emailMessage}</div>}

                  <Button type="submit" variant="secondary" pill loading={emailSaving}>
                    {emailSaving ? "Saving email..." : profile?.email ? "Update Email Login" : "Add Email Login"}
                  </Button>
                </form>

                <form onSubmit={(event) => void handlePhoneSubmit(event)} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                  <Input
                    label={profile?.phone ? "Phone number" : "Add phone number"}
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    autoComplete="tel"
                    placeholder="+628123456789 or 0812..."
                    inputMode="numeric"
                  />

                  {phoneError && <div className="auth-error">{phoneError}</div>}
                  {phoneMessage && <div className="auth-success">{phoneMessage}</div>}

                  <Button type="submit" variant="secondary" pill loading={phoneSaving}>
                    {phoneSaving ? "Saving phone..." : profile?.phone ? "Update Phone Login" : "Add Phone Login"}
                  </Button>
                </form>
              </div>
            </Card>

            <Card>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                {hasPasswordAuth ? "Change Password" : "Set Password"}
              </h3>
              <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                {hasPasswordAuth
                  ? "Enter your current password to choose a new one."
                  : "You signed in with Google. Set a password so you can also log in manually."}
              </p>

              <form onSubmit={(event) => void handlePasswordSubmit(event)} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                {hasPasswordAuth && (
                  <Input
                    label="Current Password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your current password"
                  />
                )}

                <Input
                  label="New Password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                />

                <Input
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat the new password"
                />

                {passwordError && <div className="auth-error">{passwordError}</div>}
                {passwordMessage && <div className="auth-success">{passwordMessage}</div>}

                <Button type="submit" variant="primary" pill loading={savingPassword}>
                  {getPasswordButtonText(savingPassword, hasPasswordAuth)}
                </Button>
              </form>
            </Card>

            <Card>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.1rem", fontWeight: 700 }}>
                Delete Account
              </h3>
              <p style={{ margin: "0 0 1.25rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                This deactivates your account and signs you out from this device.
              </p>

              <form onSubmit={(event) => void handleDeleteAccount(event)} style={{ display: "grid", gap: "1rem", maxWidth: "480px" }}>
                <Input
                  label="Confirmation"
                  value={deleteConfirmation}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  type="text"
                  placeholder="Type DELETE"
                />

                {deleteError && <div className="auth-error">{deleteError}</div>}

                <Button
                  type="submit"
                  variant="danger"
                  pill
                  loading={deletingAccount}
                  disabled={deleteConfirmation.trim() !== "DELETE"}
                >
                  {deletingAccount ? "Deleting account..." : "Delete Account"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
    </div>
  );
}
