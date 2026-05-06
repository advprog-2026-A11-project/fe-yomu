"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";

export function LoginForm() {
  const { signIn, startGoogleSignIn } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn({
        identifier: identifier.trim(),
        password,
      });
    } catch (submitError) {
      setError(normalizeAuthError(submitError, "login"));
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
        label="Continue with Google"
        onClick={() => void handleGoogleSignIn()}
      />

      <div className="divider-line">
        <span>or sign in with your account</span>
      </div>

      <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>Email, username, or phone</span>
          <input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            type="text"
            autoComplete="username"
            placeholder="you@yomu.id"
            required
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
        </label>

        {error ? <p className="form-feedback form-feedback-error">{error}</p> : null}

        <button type="submit" className="button button-primary" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
