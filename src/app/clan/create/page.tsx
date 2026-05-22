"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export default function CreateClanPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/clan/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clanName: name }),
    });
    router.push(ROUTES.clan.list);
  };

  return (
    <ProtectedRoute description="Sign in to create a clan.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Create</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Create New Clan
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
              Start your own clan and begin competing in the league.
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
              <Input
                label="Clan Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your clan name"
                required
              />

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Button variant="ghost" pill onClick={() => router.push(ROUTES.clan.list)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" pill loading={loading}>
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
