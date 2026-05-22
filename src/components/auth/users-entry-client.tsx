"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/ui/LoadingState";

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
          ? "Create an account to unlock the full Yomu experience."
          : "Sign in to continue to the page you wanted to open.",
    });
  }, [isAuthenticated, mode, nextPath, openAuthModal, router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <LoadingState message="Redirecting to authentication..." />
    </div>
  );
}
