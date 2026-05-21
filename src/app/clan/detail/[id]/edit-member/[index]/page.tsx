"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export default function EditMemberPage() {
  const { id, index } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [score, setScore] = useState(Number(searchParams.get("score")) || 0);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clan/${id}/edit-member/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    router.push(ROUTES.clan.detail(id as string));
  };

  return (
    <ProtectedRoute description="Sign in to edit clan member scores.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Edit Member</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Edit Member {Number(index) + 1} Score
            </h1>
          </div>

          <Card>
            <form onSubmit={handleUpdate} style={{ display: "grid", gap: "1.25rem" }}>
              <Input
                label="Member Score"
                type="number"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                placeholder="Enter new score"
                required
              />

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Button variant="ghost" pill onClick={() => router.push(ROUTES.clan.detail(id as string))}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" pill loading={loading}>
                  Update Score
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
