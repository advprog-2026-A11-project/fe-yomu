"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <div className="auth-form-container">
      <GoogleAuthButton
        loading={loading}
        label="Continue with Google"
        onClick={() => void handleGoogleSignIn()}
      />

      <div className="auth-form-divider">
        <span>or sign in with your account</span>
      </div>

      <form className="auth-form-actions" onSubmit={(event) => void handleSubmit(event)}>
        <Input
          label="Email, username, or phone"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          type="text"
          autoComplete="username"
          placeholder="you@yomu.id / username / 0812..."
          required
        />

        <Input
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
        />

        {error && <div className="auth-error">{error}</div>}

        <Button type="submit" variant="primary" pill loading={loading} style={{ width: "100%" }}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
