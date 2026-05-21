"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";

type RegisterIdentifierMode = "email" | "phone" | "both";

function hasValidPhoneDigitCount(value: string): boolean {
  const compact = value.replaceAll(/[\s\-()+]/g, "");
  return compact.length >= 8 && compact.length <= 15 && /^\d+$/.test(compact);
}

export function RegisterForm() {
  const { register, startGoogleSignIn } = useAuth();
  const [identifierMode, setIdentifierMode] = useState<RegisterIdentifierMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const needsEmail = identifierMode === "email" || identifierMode === "both";
    const needsPhone = identifierMode === "phone" || identifierMode === "both";

    if (needsEmail && !trimmedEmail) {
      setError("Email is required for this registration method.");
      return;
    }

    if (needsPhone && !hasValidPhoneDigitCount(trimmedPhone)) {
      setError("Phone number must contain 8-15 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email: needsEmail ? trimmedEmail : undefined,
        phone: needsPhone ? trimmedPhone : undefined,
        password,
        username: username.trim() || undefined,
        displayName: displayName.trim() || undefined,
      });
    } catch (submitError) {
      setError(normalizeAuthError(submitError, "register"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    await runGoogleAuthAction(startGoogleSignIn, setLoading, setError);
  }

  return (
    <div className="auth-panel-stack">
      <GoogleAuthButton
        loading={loading}
        label="Register with Google"
        onClick={() => void handleGoogleSignIn()}
      />

      <div className="divider-line">
        <span>or create an account with email, phone, or both</span>
      </div>

      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <fieldset className="field">
          <legend>Register with</legend>
          <div className="segmented-control" aria-label="Register with">
            <label>
              <input
                type="radio"
                name="register-identifier-mode"
                value="email"
                checked={identifierMode === "email"}
                onChange={() => setIdentifierMode("email")}
              />
              <span>Email</span>
            </label>
            <label>
              <input
                type="radio"
                name="register-identifier-mode"
                value="phone"
                checked={identifierMode === "phone"}
                onChange={() => setIdentifierMode("phone")}
              />
              <span>Phone</span>
            </label>
            <label>
              <input
                type="radio"
                name="register-identifier-mode"
                value="both"
                checked={identifierMode === "both"}
                onChange={() => setIdentifierMode("both")}
              />
              <span>Both</span>
            </label>
          </div>
        </fieldset>

        {identifierMode === "email" || identifierMode === "both" ? (
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@yomu.id"
              required
            />
          </label>
        ) : null}

        {identifierMode === "phone" || identifierMode === "both" ? (
          <label className="field">
            <span>Phone number</span>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              type="tel"
              autoComplete="tel"
              placeholder="+628123456789 or 0812..."
              inputMode="numeric"
              required
            />
          </label>
        ) : null}

        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            required
          />
        </label>

        <label className="field">
          <span>Username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            type="text"
            autoComplete="username"
            placeholder="Choose a username"
            required
          />
        </label>

        <label className="field">
          <span>Display name</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            type="text"
            autoComplete="nickname"
            placeholder="How Yomu should greet you"
            required
          />
        </label>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </div>
  );
}
