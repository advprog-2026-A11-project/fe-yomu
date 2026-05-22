"use client";

import { useState, type FormEvent } from "react";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { runGoogleAuthAction } from "@/components/auth/google-auth-action";
import { useAuth } from "@/components/providers/auth-provider";
import { normalizeAuthError } from "@/lib/auth-client";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";

type RegisterMode = "email" | "phone" | "both";

const REGISTER_MODE_ITEMS = [
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "both", label: "Both" },
];

function hasValidPhoneDigitCount(value: string): boolean {
  const compact = value.replaceAll(/[\s\-()+]/g, "");
  return compact.length >= 8 && compact.length <= 15 && /^\d+$/.test(compact);
}

function includesEmail(mode: RegisterMode): boolean {
  return mode === "email" || mode === "both";
}

function includesPhone(mode: RegisterMode): boolean {
  return mode === "phone" || mode === "both";
}

function normalizeOptionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function RegisterForm() {
  const { register, startGoogleSignIn } = useAuth();
  const [mode, setMode] = useState<RegisterMode>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const normalizedUsername = normalizeOptionalText(username);
    const normalizedDisplayName = normalizeOptionalText(displayName);
    const shouldSendEmail = includesEmail(mode);
    const shouldSendPhone = includesPhone(mode);

    if (shouldSendEmail && !trimmedEmail) {
      setError("Email is required.");
      return;
    }

    if (shouldSendPhone && !hasValidPhoneDigitCount(trimmedPhone)) {
      setError("Phone number must contain 8-15 digits.");
      return;
    }

    if (normalizedUsername && (normalizedUsername.length < 3 || normalizedUsername.length > 30)) {
      setError("Username must be 3-30 characters.");
      return;
    }

    if (normalizedDisplayName && normalizedDisplayName.length > 100) {
      setError("Display name must be 100 characters or fewer.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        email: shouldSendEmail ? trimmedEmail : undefined,
        phone: shouldSendPhone ? trimmedPhone : undefined,
        password,
        username: normalizedUsername,
        displayName: normalizedDisplayName,
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
        <span>or create an account manually</span>
      </div>

      <form className="auth-form-actions" onSubmit={(event) => void handleSubmit(event)}>
        <Tabs
          items={REGISTER_MODE_ITEMS}
          active={mode}
          onChange={(nextMode) => {
            setMode(nextMode as RegisterMode);
            setError(null);
          }}
          size="sm"
        />

        {includesEmail(mode) && (
          <Input
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@yomu.id"
            required
          />
        )}

        {includesPhone(mode) && (
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
        )}

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
