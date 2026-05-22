"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ROUTES } from "@/constants";

type Clan = {
  clanId: string;
  clanName: string;
  leaderId: string;
  applicantIds: string[];
};

export default function ApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, status } = useAuth();

  const [clan, setClan] = useState<Clan | null>(null);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const authUserId = session?.profile?.id ?? null;

  const fetchUserNames = useCallback(async (userIds: string[]) => {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    if (unique.length === 0) return;
    try {
      const res = await fetch("/api/auth-proxy/users/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: unique }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.profiles)) {
        const names: Record<string, string> = {};
        data.profiles.forEach((u: any) => {
          names[u.id] = u.displayName || u.username || u.name || u.id;
        });
        setUserNames((prev) => ({ ...prev, ...names }));
      }
    } catch (err) {
      console.error("Failed to look up user names:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clan/detail/${id}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data: Clan = await res.json();
      setClan(data);
      if (data.applicantIds?.length > 0) {
        fetchUserNames(data.applicantIds);
      }
    } catch (err) {
      console.error("Failed to load clan:", err);
    } finally {
      setLoading(false);
    }
  }, [id, fetchUserNames]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDecision = async (
    applicantId: string,
    action: "accept" | "reject"
  ) => {
    setProcessingId(applicantId);
    setError(null);
    try {
      const res = await fetch(`/api/clan/${id}/${action}/${applicantId}`, {
        method: "POST",
      });
      if (!res.ok) {
        const msg = await res.text();
        setError(msg || `Failed to ${action} applicant.`);
      } else {
        await refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading applicants..." />
        </div>
      </div>
    );
  }

  // If the clan doesn't exist or the user is not the leader, redirect away
  if (!clan) {
    router.replace(ROUTES.clan.list);
    return null;
  }

  if (authUserId && clan.leaderId && authUserId !== clan.leaderId) {
    router.replace(ROUTES.clan.detail(id as string));
    return null;
  }

  return (
    <ProtectedRoute description="Sign in to manage your clan.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "700px" }}>
          {/* Back link */}
          <button
            onClick={() => router.push(ROUTES.clan.detail(id as string))}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 0,
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: "1.25rem",
            }}
          >
            ← Back to {clan.clanName}
          </button>

          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Manage</p>
            <h1
              style={{
                margin: "0.25rem 0 0",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Applicants
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
              Review and manage membership requests for{" "}
              <strong>{clan.clanName}</strong>.
            </p>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "1rem",
                padding: "0.75rem 1rem",
                background: "var(--color-danger-bg, #fef2f2)",
                border: "1px solid var(--color-danger, #dc2626)",
                borderRadius: "0.5rem",
                color: "var(--color-danger, #dc2626)",
                fontSize: "0.875rem",
              }}
            >
              {error}
            </div>
          )}

          {clan.applicantIds?.length === 0 ? (
            <EmptyState
              icon="📭"
              title="No Pending Applications"
              description="There are no pending applications for your clan right now."
            />
          ) : (
            <Card>
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {clan.applicantIds.map((applicantId) => {
                  const displayName = userNames[applicantId] || applicantId;
                  const isProcessing = processingId === applicantId;

                  return (
                    <Card
                      key={applicantId}
                      variant="raised"
                      padding="sm"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "1rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        <Avatar name={displayName} size="md" />
                        <div style={{ fontWeight: 600 }}>{displayName}</div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button
                          variant="success"
                          size="sm"
                          pill
                          loading={isProcessing}
                          disabled={!!processingId && !isProcessing}
                          onClick={() =>
                            handleDecision(applicantId, "accept")
                          }
                        >
                          Accept
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          pill
                          loading={isProcessing}
                          disabled={!!processingId && !isProcessing}
                          onClick={() =>
                            handleDecision(applicantId, "reject")
                          }
                        >
                          Reject
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
