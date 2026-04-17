"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export function UsersEntryClient({
  mode,
  nextPath,
}: {
  mode: "login" | "register";
  nextPath: string;
}) {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }

    openAuthModal({
      mode,
      nextPath,
      reason:
        mode === "register"
          ? "Create an account to unlock the internal Yomu experience."
          : "Sign in to continue to the page you wanted to open.",
    });
  }, [isAuthenticated, mode, nextPath, openAuthModal, router]);

  return (
    <section className="auth-hub">
      <div className="shell">
        <div className="auth-hub-card">
          <p className="eyebrow">Auth entry</p>
          <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3rem)" }}>
            Authentication opens as a modal on top of the public home flow.
          </h1>
          <p className="muted-copy" style={{ marginTop: "1rem" }}>
            This route exists as a consistent fallback entry point, but the
            preferred experience is still the global auth modal.
          </p>
        </div>
      </div>
    </section>
  );
}
