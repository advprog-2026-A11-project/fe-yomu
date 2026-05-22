"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants";

export default function EditClanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/clan/detail/${id}`)
      .then((res) => res.json())
      .then((data) => setName(data.clanName));
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/clan/edit", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clanId: id, clanName: name }),
    });
    router.push(ROUTES.clan.detail(id as string));
  };

  return (
    <ProtectedRoute description="Sign in to edit clan information.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container" style={{ maxWidth: "560px" }}>
          <div style={{ marginBottom: "2rem" }}>
            <p className="yomu-eyebrow">Edit</p>
            <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.5rem, 4vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Edit Clan Name
            </h1>
          </div>

          <Card>
            <form onSubmit={handleUpdate} style={{ display: "grid", gap: "1.25rem" }}>
              <Input
                label="Clan Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter new clan name"
                required
              />

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <Button variant="ghost" pill onClick={() => router.push(ROUTES.clan.detail(id as string))}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" pill loading={loading}>
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
