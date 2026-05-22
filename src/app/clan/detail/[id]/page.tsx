"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTierConfig } from "@/utils/tiers";
import { ROUTES } from "@/constants";

type ClanMember = {
  userId: string;
  clanId: string;
  quizScore: number;
  missionScore: number;
  totalQuizzes: number;
  accuracy: number; // computed by getAccuracy() on backend
};

type Clan = {
  clanId: string;
  clanName: string;
  leaderId: string;
  tier: string;
  seasonScore: number;
  scoreMultiplier: number;
  applicantIds: string[];
};

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session, isAuthenticated, status } = useAuth();

  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [allClans, setAllClans] = useState<Clan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<{
    inClan: boolean;
    applying: boolean;
  } | null>(null);

  const authUserId = session?.profile?.id ?? null;

  const fetchUserNames = useCallback(
    async (userIds: string[]) => {
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
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [clanRes, membersRes, allClansRes, statusRes] = await Promise.all([
        fetch(`/api/clan/detail/${id}`),
        fetch(`/api/clan/${id}/members`),
        fetch("/api/clan/list"),
        isAuthenticated ? fetch("/api/clan/membership-status") : Promise.resolve(null),
      ]);

      if (clanRes.ok) {
        const data: Clan = await clanRes.json();
        setClan(data);
      }

      if (statusRes && statusRes.ok) {
        setMembershipStatus(await statusRes.json());
      }

      if (membersRes.ok) {
        const data: ClanMember[] = await membersRes.json();
        setMembers(data);
        // Fetch display names for all member IDs
        fetchUserNames(data.map((m) => m.userId));
      }

      if (allClansRes.ok) {
        const data: Clan[] = await allClansRes.json();
        setAllClans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load clan detail:", err);
    } finally {
      setLoading(false);
    }
  }, [id, fetchUserNames]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // --- Derived state ---
  const isLeader = !!authUserId && clan?.leaderId === authUserId;
  const isMember = members.some((m) => m.userId === authUserId);
  const isApplyingToThisClan = clan?.applicantIds?.includes(authUserId ?? "") ?? false;
  const isStudent = session?.profile?.role === "STUDENT";

  const canApply =
    isAuthenticated &&
    isStudent && 
    !isLeader &&
    !isMember &&
    !isApplyingToThisClan &&
    membershipStatus !== null &&
    !membershipStatus.inClan &&
    !membershipStatus.applying;

  // --- Actions ---
  const doAction = async (
    endpoint: string,
    method: "POST" | "DELETE",
    redirectOnSuccess?: string
  ) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/clan/${id}${endpoint}`, { method });
      if (!res.ok) {
        const msg = await res.text();
        setActionError(msg || "Action failed.");
      } else {
        if (redirectOnSuccess) {
          router.push(redirectOnSuccess);
        } else {
          await refresh();
        }
      }
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApply = () => doAction("/apply", "POST");
  const handleCancelApplication = () => doAction("/cancel-application", "DELETE");
  const handleQuit = () => {
    if (confirm("Are you sure you want to leave this clan?")) {
      doAction("/quit", "DELETE", ROUTES.clan.list);
    }
  };
  const handleDeleteClan = async () => {
    if (!confirm("Are you sure you want to permanently delete this clan?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/clan/delete/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const msg = await res.text();
        setActionError(msg || "Failed to delete clan.");
        setActionLoading(false);
      } else {
        router.push(ROUTES.clan.list);
      }
    } catch {
      setActionError("Network error.");
      setActionLoading(false);
    }
  };
  const handleKick = (memberId: string) => {
    if (confirm("Are you sure you want to kick this member?")) {
      fetch(`/api/clan/${id}/kick/${memberId}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) res.text().then((t) => setActionError(t));
          else refresh();
        })
        .catch(() => setActionError("Network error."));
    }
  };

  // --- Render ---
  if (loading || status === "loading") {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading clan details..." />
        </div>
      </div>
    );
  }

  if (!clan) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <EmptyState
            icon="⚔️"
            title="Clan Not Found"
            description="This clan does not exist or has been deleted."
          />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href={ROUTES.clan.list}>
              <Button variant="primary" pill>
                Back to Clans
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tierConfig = getTierConfig(clan.tier || "Bronze");

  return (
    <ProtectedRoute description="Sign in to view clan details.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          {/* Back button */}
          <button
            onClick={() => router.push(ROUTES.clan.list)}
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
            ← Back to Clans
          </button>

          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h1
              style={{
                margin: "0 0 0.5rem",
                fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              {clan.clanName}
            </h1>
            <div
              style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}
            >
              <Badge tier={tierConfig.label.toLowerCase() as any} size="lg">
                {clan.tier}
              </Badge>
              <Badge tier="gold" size="lg">
                {clan.seasonScore ?? 0} pts this season
              </Badge>
              {clan.scoreMultiplier !== 1.0 && (
                <Badge
                  tier={clan.scoreMultiplier > 1 ? "silver" : "bronze"}
                  size="lg"
                >
                  ×{clan.scoreMultiplier.toFixed(1)} multiplier
                </Badge>
              )}
            </div>
          </div>

          {/* Error banner */}
          {actionError && (
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
              {actionError}
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "2rem",
              flexWrap: "wrap",
            }}
          >
            {canApply && (
              <Button
                variant="success"
                pill
                size="sm"
                loading={actionLoading}
                onClick={handleApply}
              >
                Apply to Join
              </Button>
            )}

            {isApplyingToThisClan && (
              <Button
                variant="secondary"
                pill
                size="sm"
                loading={actionLoading}
                onClick={handleCancelApplication}
              >
                Cancel Application
              </Button>
            )}

            {isMember && !isLeader && (
              <Button
                variant="danger"
                pill
                size="sm"
                loading={actionLoading}
                onClick={handleQuit}
              >
                Leave Clan
              </Button>
            )}

            {isLeader && (
              <>
                <Link href={ROUTES.clan.applicants(id as string)}>
                  <Button variant="secondary" pill size="sm">
                    Manage Applicants
                    {clan.applicantIds?.length > 0 && (
                      <span
                        style={{
                          marginLeft: "0.4rem",
                          background: "var(--color-primary, #2563eb)",
                          color: "#fff",
                          borderRadius: "999px",
                          padding: "0 0.45rem",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                        }}
                      >
                        {clan.applicantIds.length}
                      </span>
                    )}
                  </Button>
                </Link>
                <Link href={ROUTES.clan.edit(id as string)}>
                  <Button variant="ghost" pill size="sm">
                    Edit Name
                  </Button>
                </Link>
                <Button
                  variant="danger"
                  pill
                  size="sm"
                  loading={actionLoading}
                  onClick={handleDeleteClan}
                >
                  Delete Clan
                </Button>
              </>
            )}
          </div>

          {/* Members table */}
          <Card>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>
              Members ({members.length})
            </h3>

            {members.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No Members Yet"
                description="This clan has no members. Apply to be the first!"
              />
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {members.map((member) => {
                  const displayName =
                    userNames[member.userId] || member.userId;
                  const isThisLeader = member.userId === clan.leaderId;
                  const isMe = member.userId === authUserId;
                  const accuracyPct = Math.round((member.accuracy ?? 0) * 100);

                  return (
                    <Card
                      key={member.userId}
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
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {displayName}
                            {isMe && (
                              <span
                                style={{
                                  marginLeft: "0.4rem",
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                (you)
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {isThisLeader ? "👑 Leader" : "Member"} ·{" "}
                            {member.totalQuizzes} quiz
                            {member.totalQuizzes !== 1 ? "zes" : ""} · {accuracyPct}% avg accuracy
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        <Badge tier="gold">
                          {(member.quizScore ?? 0) + (member.missionScore ?? 0)} pts
                        </Badge>
                        <Badge tier="silver">
                          {member.quizScore ?? 0} quiz
                        </Badge>
                        <Badge tier="bronze">
                          {member.missionScore ?? 0} mission
                        </Badge>

                        {isLeader && !isThisLeader && (
                          <Button
                            variant="danger"
                            size="sm"
                            pill
                            onClick={() => handleKick(member.userId)}
                          >
                            Kick
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
