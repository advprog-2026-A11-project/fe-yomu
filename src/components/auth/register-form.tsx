"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";

export function RegisterForm() {
  const { register, startGoogleSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({
        email: email.trim(),
        phone: phone.trim(),
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
        <span>or create an account with email and phone</span>
      </div>

      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
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

        <label className="field">
          <span>Phone number</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            autoComplete="tel"
            placeholder="+628123456789 or 0812..."
            required
          />
        </label>

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
