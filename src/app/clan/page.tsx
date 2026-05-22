"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTierConfig } from "@/utils/tiers";
import { ROUTES } from "@/constants";

export default function ClanListPage() {
  const [clans, setClans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClans = () => {
    setIsLoading(true);
    fetch("/api/clan/list")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setClans(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setClans([]);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchClans();
  }, []);

  const deleteClan = async (id: string) => {
    if (confirm("Are you sure you want to delete this clan?")) {
      await fetch(`/api/clan/delete/${id}`, { method: "DELETE" });
      fetchClans();
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading clans..." />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute description="Sign in to view and manage clans.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="yomu-eyebrow">League</p>
              <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Clans & Leaderboard
              </h1>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                Join a clan, compete in tiers, and climb the leaderboard.
              </p>
            </div>

            <Link href={ROUTES.clan.create}>
              <Button variant="primary" pill leftIcon="+">
                Create Clan
              </Button>
            </Link>
          </div>

          {clans.length === 0 ? (
            <>
              <EmptyState
                icon="⚔️"
                title="No Clans Found"
                description="No clans have been created yet. Be the first to start one!"
              />
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link href={ROUTES.clan.create}>
                  <Button variant="primary" pill leftIcon="+">Create Clan</Button>
                </Link>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              {clans.map((clan) => {
                const tierConfig = getTierConfig(clan.rankTier || "");
                return (
                  <Card key={clan.clanId} hoverable>
                    <div style={{ marginBottom: "1rem" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 700 }}>
                        {clan.clanName}
                      </h3>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {clan.rankTier && <Badge tier={tierConfig.label.toLowerCase() as any}>{clan.rankTier}</Badge>}
                        <Badge tier="gold">{clan.clanScore ?? 0} pts</Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                      <Link href={ROUTES.clan.detail(clan.clanId)} style={{ flex: 1 }}>
                        <Button variant="primary" pill size="sm" style={{ width: "100%" }}>
                          View
                        </Button>
                      </Link>
                      <Link href={ROUTES.clan.edit(clan.clanId)} style={{ flex: 1 }}>
                        <Button variant="secondary" pill size="sm" style={{ width: "100%" }}>
                          Edit
                        </Button>
                      </Link>
                      <Button variant="danger" pill size="sm" onClick={() => deleteClan(clan.clanId)}>
                        Delete
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
