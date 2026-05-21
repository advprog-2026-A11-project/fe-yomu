"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { LoadingState } from "@/components/states/loading-state";
import { useAuth } from "@/components/providers/auth-provider";
import { changePassword, normalizeAuthError, updateEmail, updatePhone } from "@/lib/auth-client";

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
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    setEmailError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      return;
    }

    setSavingEmail(true);
    try {
      const response = await updateEmail({ email: trimmedEmail });
      await refreshSession();
      setEmail("");
      setEmailMessage(response.message || "Email login method updated.");
    } catch (error) {
      setEmailError(normalizeAuthError(error, "register"));
    } finally {
      setSavingEmail(false);
    }
  }

  async function handlePhoneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhoneMessage(null);
    setPhoneError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      setPhoneError("Phone number is required.");
      return;
    }

    setSavingPhone(true);
    try {
      const response = await updatePhone({ phone: trimmedPhone });
      await refreshSession();
      setPhone("");
      setPhoneMessage(response.message || "Phone login method updated.");
    } catch (error) {
      setPhoneError(normalizeAuthError(error, "register"));
    } finally {
      setSavingPhone(false);
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
              <p className="panel-eyebrow">Login methods</p>
              <h2>Add another way to sign in</h2>
              <p>Attach an email or phone number to this account so the same profile can be reached from either identifier.</p>
            </div>
          </div>

          <div className="account-method-grid">
            <form className="auth-form" onSubmit={(event) => void handleEmailSubmit(event)}>
              <label className="field">
                <span>{profile?.email ? "Update email login" : "Add email login"}</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder={profile?.email || "you@yomu.id"}
                  required
                />
              </label>
              {emailError ? <p className="form-feedback form-feedback-error">{emailError}</p> : null}
              {emailMessage ? <p className="form-feedback form-feedback-success">{emailMessage}</p> : null}
              <button type="submit" className="button button-secondary" disabled={savingEmail}>
                {savingEmail ? "Saving email..." : (profile?.email ? "Update email" : "Add email")}
              </button>
            </form>

            <form className="auth-form" onSubmit={(event) => void handlePhoneSubmit(event)}>
              <label className="field">
                <span>{profile?.phone ? "Update phone login" : "Add phone login"}</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  placeholder={profile?.phone || "+628123456789 or 0812..."}
                  required
                />
              </label>
              {phoneError ? <p className="form-feedback form-feedback-error">{phoneError}</p> : null}
              {phoneMessage ? <p className="form-feedback form-feedback-success">{phoneMessage}</p> : null}
              <button type="submit" className="button button-secondary" disabled={savingPhone}>
                {savingPhone ? "Saving phone..." : (profile?.phone ? "Update phone" : "Add phone")}
              </button>
            </form>
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
