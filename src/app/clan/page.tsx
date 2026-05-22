"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTierConfig } from "@/utils/tiers";
import { ROUTES } from "@/constants";

type Season = {
  id: string;
  seasonNumber: number;
  startDate: string;
  endDate: string | null;
  active: boolean;
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

export default function ClanListPage() {
  const { session, isAdmin, isAuthenticated, status } = useAuth();
  const router = useRouter();

  const [clans, setClans] = useState<Clan[]>([]);
  const [season, setSeason] = useState<Season | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEndingSeason, setIsEndingseason] = useState(false);
  const [endSeasonError, setEndSeasonError] = useState<string | null>(null);
  const [endSeasonSuccess, setEndSeasonSuccess] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<{
    inClan: boolean;
    applying: boolean;
  } | null>(null);

  const authUserId = session?.profile?.id ?? null;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clansRes, seasonRes] = await Promise.all([
        fetch("/api/clan/list"),
        fetch("/api/clan/league/current-season"),
      ]);

      if (clansRes.ok) {
        const data = await clansRes.json();
        setClans(Array.isArray(data) ? data : []);
      }

      if (seasonRes.ok) {
        const data = await seasonRes.json();
        // Backend returns the season object directly, or a string if none exists
        if (data && typeof data === "object" && data.seasonNumber) {
          setSeason(data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch clan data:", err);
    } finally {
      setIsLoading(false);
    }
    if (isAuthenticated) {
      const statusRes = await fetch("/api/clan/membership-status");
      if (statusRes.ok) {
        setMembershipStatus(await statusRes.json());
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute membership state for the logged-in user
  const userMembership = (() => {
    if (!authUserId) return { inClan: false, applying: false, myClanId: null };
    for (const clan of clans) {
      // The backend now returns members via ClanMemberRepository,
      // but the list endpoint only returns Clan fields.
      // We rely on a separate detail fetch for member info.
      // For the list page, we just check applicants to detect pending applications.
      if (clan.applicantIds?.includes(authUserId)) {
        return { inClan: false, applying: true, myClanId: null };
      }
    }
    return { inClan: false, applying: false, myClanId: null };
  })();

  const isStudent = session?.profile?.role === "STUDENT";
  // We show "Create Clan" only if the student is not currently applying.
  // Whether they're already in a clan is determined server-side on submit.
  const canCreateClan =
    isAuthenticated &&
    isStudent &&
    membershipStatus !== null &&
    !membershipStatus.inClan &&
    !membershipStatus.applying;

  const handleEndSeason = async () => {
    if (
      !confirm(
        "Are you sure you want to end the current season? This will process all promotions and degradations and cannot be undone."
      )
    )
      return;

    setIsEndingseason(true);
    setEndSeasonError(null);
    setEndSeasonSuccess(false);

    try {
      const res = await fetch("/api/clan/admin/league/end-season", {
        method: "POST",
      });

      if (!res.ok) {
        const text = await res.text();
        setEndSeasonError(text || "Failed to end season.");
      } else {
        setEndSeasonSuccess(true);
        await fetchData();
      }
    } catch (err) {
      setEndSeasonError("Network error. Please try again.");
    } finally {
      setIsEndingseason(false);
    }
  };

  if (isLoading || status === "loading") {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0 4rem" }}>
      <div className="container">
        {/* Page header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <p className="yomu-eyebrow">League</p>
            <h1
              style={{
                margin: "0.25rem 0 0",
                fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Clans &amp; Leaderboard
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
              Join a clan, compete in tiers, and climb the leaderboard.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {canCreateClan && (
              <Link href={ROUTES.clan.create}>
                <Button variant="primary" pill leftIcon="+">
                  Create Clan
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Season info + admin controls */}
        <Card
          style={{
            marginBottom: "2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>
              {season ? `Season ${season.seasonNumber}` : "No Active Season"}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              {season
                ? `Started ${new Date(season.startDate).toLocaleDateString()}`
                : "Contact an admin to start a season."}
            </div>
            {endSeasonSuccess && (
              <div
                style={{
                  marginTop: "0.5rem",
                  color: "var(--color-success, #16a34a)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                }}
              >
                ✓ Season ended successfully. New season has begun.
              </div>
            )}
            {endSeasonError && (
              <div
                style={{
                  marginTop: "0.5rem",
                  color: "var(--color-danger, #dc2626)",
                  fontSize: "0.85rem",
                }}
              >
                {endSeasonError}
              </div>
            )}
          </div>

          {isAdmin && (
            <Button
              variant="danger"
              pill
              loading={isEndingSeason}
              onClick={handleEndSeason}
            >
              End Season
            </Button>
          )}
        </Card>

        {/* Clan list */}
        {clans.length === 0 ? (
          <>
            <EmptyState
              icon="⚔️"
              title="No Clans Yet"
              description="No clans have been created yet. Be the first to start one!"
            />
            {canCreateClan && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link href={ROUTES.clan.create}>
                  <Button variant="primary" pill leftIcon="+">
                    Create Clan
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {clans.map((clan, index) => {
              const tierConfig = getTierConfig(clan.tier || "Bronze");
              return (
                <Card key={clan.clanId} hoverable>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                      }}
                    >
                      #{index + 1}
                    </span>
                    <Badge tier={tierConfig.label.toLowerCase() as any}>
                      {clan.tier}
                    </Badge>
                  </div>

                  <h3
                    style={{
                      margin: "0 0 0.5rem",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  >
                    {clan.clanName}
                  </h3>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      flexWrap: "wrap",
                      marginBottom: "1rem",
                    }}
                  >
                    <Badge tier="gold">{clan.seasonScore ?? 0} pts</Badge>
                    {clan.scoreMultiplier !== 1.0 && (
                      <Badge
                        tier={clan.scoreMultiplier > 1 ? "silver" : "bronze"}
                      >
                        ×{clan.scoreMultiplier.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  <Link
                    href={ROUTES.clan.detail(clan.clanId)}
                    style={{ display: "block" }}
                  >
                    <Button
                      variant="primary"
                      pill
                      size="sm"
                      style={{ width: "100%" }}
                    >
                      View Clan
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
