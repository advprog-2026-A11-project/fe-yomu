"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export default function CreateClanPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clan/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clanName: name.trim() }),
      });

      if (!res.ok) {
        const message = await res.text();
        setError(message || "Failed to create clan.");
        return;
      }

      router.push(ROUTES.clan.list);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute description="Sign in to create a clan.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Create</p>
            <h1
              style={{
                margin: "0.25rem 0 0",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Create New Clan
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
              Start your own clan and compete in the league.
            </p>
          </div>

          <Card>
            <form
              onSubmit={handleSubmit}
              style={{ display: "grid", gap: "1.25rem" }}
            >
              <Input
                label="Clan Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your clan name"
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
                  onClick={() => router.push(ROUTES.clan.list)}
                  type="button"
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
                  Create Clan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
