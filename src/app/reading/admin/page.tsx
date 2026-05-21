"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDifficultyConfig } from "@/utils/tiers";
import { ROUTES } from "@/constants";

const API_BASE_URL = "/api/reading-admin";

export default function BacaanPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
  }, []);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reading-list`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setReadings(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load reading materials: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchReadings();
      } else {
        alert("Failed to delete material");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading materials..." />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute description="Sign in to manage reading materials.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p className="yomu-eyebrow">Admin Panel</p>
              <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
                Reading Materials
              </h1>
              <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                Manage reading materials and exercises
              </p>
            </div>

            <Link href={ROUTES.reading.adminCreate}>
              <Button variant="primary" pill leftIcon="+">
                Create Exercise
              </Button>
            </Link>
          </div>

          {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}

          {readings.length === 0 ? (
            <>
              <EmptyState
                icon="📚"
                title="No Materials Found"
                description="Start by creating your first reading exercise."
              />
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <Link href={ROUTES.reading.adminCreate}>
                  <Button variant="primary" pill leftIcon="+">Create Exercise</Button>
                </Link>
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {readings.map((item: any) => {
                const diffConfig = getDifficultyConfig(item.difficultyLevel || "");
                return (
                  <Card key={item.id} hoverable style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <Link href={ROUTES.reading.adminDetail(item.id)} style={{ textDecoration: "none" }}>
                        <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--brand)" }}>
                          {item.title}
                        </h3>
                      </Link>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <Badge variant="brand">{item.category || "General"}</Badge>
                        <Badge variant={
                          item.difficultyLevel === "BEGINNER" ? "success" :
                          item.difficultyLevel === "INTERMEDIATE" ? "warning" : "danger"
                        }>
                          {diffConfig.label}
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={ROUTES.reading.adminEdit(item.id)}>
                        <Button variant="secondary" size="sm" pill>Edit</Button>
                      </Link>
                      <Link href={ROUTES.reading.adminQuiz(item.id)}>
                        <Button variant="ghost" size="sm" pill>Quiz</Button>
                      </Link>
                      <Button variant="danger" size="sm" pill onClick={() => handleDelete(item.id)}>
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
