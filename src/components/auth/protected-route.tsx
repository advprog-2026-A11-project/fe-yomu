"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";

export function ProtectedRoute({
  children,
  title = "Sign in required",
  description = "This page is part of the Yomu app experience. Sign in to continue.",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const { status, isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      openAuthModal({
        mode: "login",
        nextPath: pathname || "/dashboard",
        reason: description,
      });
    }
  }, [description, openAuthModal, pathname, status]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return (
      <EmptyState
        title={title}
        description={description}
        action={
          <button
            type="button"
            className="button button-primary"
            onClick={() =>
              openAuthModal({
                mode: "login",
                nextPath: pathname || "/dashboard",
                reason: description,
              })
            }
          >
            Open sign in
          </button>
        }
      />
    );
  }

  return <>{children}</>;
}
