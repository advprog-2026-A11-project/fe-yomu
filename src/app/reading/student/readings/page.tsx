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
import { truncate } from "@/utils/format";
import { ROUTES } from "@/constants";

const API_STUDENT = "/api/reading-student";

export default function StudentReadingPage() {
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReadings = async () => {
      try {
        const response = await fetch(API_STUDENT, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          setReadings(data);
        } else {
          setError("Failed to load readings");
        }
      } catch (err) {
        setError("Failed to load readings");
      } finally {
        setLoading(false);
      }
    };
    fetchReadings();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading reading materials..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <EmptyState
            icon="⚠️"
            title="Failed to Load"
            description={error}
          />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Button variant="primary" pill onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute description="Sign in to access reading materials.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <p className="yomu-eyebrow">Reading Materials</p>
            <h1 style={{ margin: "0.5rem 0 0", fontSize: "clamp(2rem, 5vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Discover Your Next Read
            </h1>
            <p style={{ margin: "0.75rem auto 0", maxWidth: "600px", color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6 }}>
              Choose a reading, test your comprehension, and level up your literacy skills.
            </p>
          </div>

          {readings.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No Materials Yet"
              description="There are no reading materials available yet. Check back later!"
            />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              {readings.map((reading: any) => (
                <ReadingCard key={reading.id} reading={reading} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function ReadingCard({ reading }: { reading: any }) {
  const diffConfig = getDifficultyConfig(reading.difficultyLevel || "");

  return (
    <Card hoverable style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "1.5rem", flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem", gap: "0.5rem" }}>
          <Badge variant="brand">{reading.category || "General"}</Badge>
          {reading.difficultyLevel && (
            <Badge variant={
              reading.difficultyLevel === "BEGINNER" ? "success" :
              reading.difficultyLevel === "INTERMEDIATE" ? "warning" : "danger"
            }>
              {diffConfig.label}
            </Badge>
          )}
        </div>

        <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem", fontWeight: 700, lineHeight: 1.3 }}>
          {reading.title}
        </h3>

        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {truncate(reading.content || "", 120)}
        </p>
      </div>

      <div style={{ padding: "0 1.5rem 1.5rem" }}>
        <Link href={ROUTES.reading.studentDetail(reading.id)} style={{ textDecoration: "none" }}>
          <Button variant="primary" pill style={{ width: "100%" }} rightIcon="→">
            Start Reading
          </Button>
        </Link>
      </div>
    </Card>
  );
}
