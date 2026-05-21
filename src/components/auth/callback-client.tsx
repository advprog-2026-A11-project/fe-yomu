"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
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
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    if (hasHandledCallback.current) {
      return;
    }

    if (oauthError) {
      hasHandledCallback.current = true;
      setError(normalizeAuthError(oauthError, "google"));
      return;
    }

    if (!code) {
      hasHandledCallback.current = true;
      setError(normalizeAuthError("Missing Google callback code.", "google"));
      return;
    }

    hasHandledCallback.current = true;
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
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <EmptyState
            icon="⚠️"
            title="Google sign in could not be completed"
            description={error}
            action={
              <Button variant="primary" pill onClick={() => router.replace("/")}>
                Back to home
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "4rem 0" }}>
      <div className="container">
        <LoadingState
          message="Finishing Google sign in..."
        />
      </div>
    </div>
  );
}
