"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { LoadingState } from "@/components/ui/LoadingState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ProtectedRoute({
  children,
  title = "Login Required",
  description = "You need to be logged in to access this page. Please sign in to continue.",
}: {
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  const router = useRouter();
  const { status, isAuthenticated, openAuthModal } = useAuth();

  if (status === "loading") {
    return <LoadingState message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "4rem 0", minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="container" style={{ maxWidth: "480px" }}>
          <Card padding="lg" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔒</div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 800 }}>{title}</h2>
            <p style={{ margin: "0 0 2rem", color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
              {description}
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <Button
                variant="primary"
                pill
                size="lg"
                onClick={() =>
                  openAuthModal({
                    mode: "login",
                    nextPath: globalThis.location.pathname,
                    reason: description,
                  })
                }
              >
                Sign In
              </Button>
              <Button
                variant="secondary"
                pill
                size="lg"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
