"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTierConfig } from "@/utils/tiers";
import { ROUTES } from "@/constants";

export default function ClanDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [clan, setClan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    setLoading(true);
    fetch(`/api/clan/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClan(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [id]);

  const deleteClan = async () => {
    if (confirm("Are you sure you want to delete this clan?")) {
      await fetch(`/api/clan/delete/${id}`, { method: "DELETE" });
      router.push(ROUTES.clan.list);
    }
  };

  const deleteMember = async (index: number) => {
    if (confirm("Remove this member's score?")) {
      await fetch(`/api/clan/${id}/delete-member/${index}`, { method: "DELETE" });
      refresh();
    }
  };

  if (loading) {
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
              <Button variant="primary" pill>Back to Clans</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tierConfig = getTierConfig(clan.rankTier || "");

  return (
    <ProtectedRoute description="Sign in to view clan details.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          {/* Header */}
          <div style={{ marginBottom: "2rem" }}>
            <button
              onClick={() => router.push(ROUTES.clan.list)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}
            >
              ← Back to Clans
            </button>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              {clan.clanName}
            </h1>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {clan.rankTier && <Badge tier={tierConfig.label.toLowerCase() as any} size="lg">{clan.rankTier}</Badge>}
              <Badge tier="gold" size="lg">{clan.clanScore ?? 0} pts</Badge>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem", flexWrap: "wrap" }}>
            <Link href={ROUTES.clan.addMember(id as string)}>
              <Button variant="success" size="sm" pill leftIcon="+">Add Member</Button>
            </Link>
            <Link href={ROUTES.clan.edit(id as string)}>
              <Button variant="secondary" size="sm" pill>Edit Name</Button>
            </Link>
            <Button variant="danger" size="sm" pill onClick={deleteClan}>Delete Clan</Button>
          </div>

          {/* Members */}
          <Card>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700 }}>Members</h3>

            {!clan.memberScores || clan.memberScores.length === 0 ? (
              <EmptyState
                icon="👥"
                title="No Members Yet"
                description="Add members to start building your clan score."
              />
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {clan.memberScores.map((score: number, index: number) => (
                  <Card key={`member-${index}-${score}`} variant="raised" padding="sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Avatar name={`Member ${index + 1}`} size="md" />
                      <div>
                        <div style={{ fontWeight: 600 }}>Member {index + 1}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Score</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Badge tier="gold">{score} pts</Badge>
                      <Link href={ROUTES.clan.editMember(id as string, String(index))}>
                        <Button variant="ghost" size="sm" pill>Edit</Button>
                      </Link>
                      <Button variant="ghost" size="sm" pill onClick={() => deleteMember(index)}>
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
