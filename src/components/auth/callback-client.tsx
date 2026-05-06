"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { normalizeAuthError } from "@/lib/auth-client";

export function CallbackClient({
  code,
  state,
  nextPath,
  oauthError,
}: {
  code?: string;
  state?: string;
  nextPath?: string;
  oauthError?: string;
}) {
  const router = useRouter();
  const { finishGoogleSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (oauthError) {
      setError(normalizeAuthError(oauthError, "google"));
      return;
    }

    if (!code) {
      setError(normalizeAuthError("Missing Google callback code.", "google"));
      return;
    }

    void finishGoogleSignIn({
      code,
      state,
      nextPath: nextPath || "/dashboard",
    }).catch((authError) => {
      setError(normalizeAuthError(authError, "google"));
    });
  }, [code, finishGoogleSignIn, nextPath, oauthError, state]);

  if (error) {
    return (
      <section className="auth-hub">
        <div className="shell">
          <EmptyState
            title="Google sign in could not be completed"
            description={error}
            action={
              <button type="button" className="button button-primary" onClick={() => router.replace("/")}>
                Back to home
              </button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="auth-hub">
      <div className="shell">
        <LoadingState
          title="Finishing Google sign in"
          description="We are validating the callback and preparing your Yomu dashboard."
        />
      </div>
    </section>
  );
}
