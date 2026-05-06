"use client";

import { normalizeAuthError } from "@/lib/auth-client";

type Setter = (value: string | null) => void;
type LoadingSetter = (value: boolean) => void;

export async function runGoogleAuthAction(
  startGoogleSignIn: () => Promise<void>,
  setLoading: LoadingSetter,
  setError: Setter,
): Promise<void> {
  setLoading(true);
  setError(null);

  try {
    await startGoogleSignIn();
  } catch (submitError) {
    setError(normalizeAuthError(submitError, "google"));
    setLoading(false);
  }
}
