"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ROUTES } from "@/constants";

export default function EditClanPage() {
  const { id } = useParams();
  const router = useRouter();
  const { session } = useAuth();

  const [name, setName] = useState("");
  const [leaderId, setLeaderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authUserId = session?.profile?.id ?? null;

  useEffect(() => {
    fetch(`/api/clan/detail/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setName(data.clanName ?? "");
        setLeaderId(data.leaderId ?? null);
        setFetching(false);
      })
      .catch(() => setFetching(false));
  }, [id]);

  // Guard: only the leader can access this page
  const isLeader = authUserId && leaderId && authUserId === leaderId;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clan/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanId: id, clanName: name.trim() }),
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message || "Failed to update clan.");
        return;
      }

      router.push(ROUTES.clan.detail(id as string));
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading clan..." />
        </div>
      </div>
    );
  }

  // Redirect non-leaders away
  if (leaderId && !isLeader) {
    router.replace(ROUTES.clan.detail(id as string));
    return null;
  }

  return (
    <ProtectedRoute description="Sign in to edit your clan.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div style={{ marginBottom: "2rem" }}>
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
                marginBottom: "0.5rem",
              }}
            >
              ← Back to Clan
            </button>
            <p className="yomu-eyebrow">Edit</p>
            <h1
              style={{
                margin: "0.25rem 0 0",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Edit Clan Name
            </h1>
          </div>

          <Card>
            <form
              onSubmit={handleUpdate}
              style={{ display: "grid", gap: "1.25rem" }}
            >
              <Input
                label="Clan Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new clan name"
                required
              />

              {error && (
                <p
                  style={{
                    margin: 0,
                    color: "var(--color-danger, #dc2626)",
                    fontSize: "0.875rem",
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="ghost"
                  pill
                  type="button"
                  onClick={() =>
                    router.push(ROUTES.clan.detail(id as string))
                  }
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  pill
                  loading={loading}
                  disabled={!name.trim()}
                >
                  Update
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
