"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function hasValidPhoneDigitCount(value: string): boolean {
  const compact = value.replaceAll(/[\s\-()+]/g, "");
  return compact.length >= 8 && compact.length <= 15 && /^\d+$/.test(compact);
}

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
    const trimmedPhone = phone.trim();

    if (!hasValidPhoneDigitCount(trimmedPhone)) {
      setError("Phone number must contain 8-15 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email: email.trim(),
        phone: trimmedPhone,
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
    <div className="auth-form-container">
      <GoogleAuthButton
        loading={loading}
        label="Register with Google"
        onClick={() => void handleGoogleSignIn()}
      />

      <div className="auth-form-divider">
        <span>or create an account with email and phone</span>
      </div>

      <form className="auth-form-actions" onSubmit={(event) => void handleSubmit(event)}>
        <Input
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
          placeholder="you@yomu.id"
          required
        />

        <Input
          label="Phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          autoComplete="tel"
          placeholder="+628123456789 or 0812..."
          inputMode="numeric"
          required
        />

        <Input
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          required
        />

        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          type="text"
          autoComplete="username"
          placeholder="Choose a username"
        />

        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          type="text"
          autoComplete="nickname"
          placeholder="How Yomu should greet you"
        />

        {error && <div className="auth-error">{error}</div>}

        <Button type="submit" variant="primary" pill loading={loading} style={{ width: "100%" }}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
