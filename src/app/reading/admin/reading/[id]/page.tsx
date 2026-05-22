"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReadingLayout from "@/components/layout/ReadingLayout";
import ReadingForum from "@/app/reading/ReadingForum";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/LoadingState";
import { ProtectedRoute } from "@/components/auth/protected-route";

const API_BASE = "/api/reading-admin";

export default function ReadingViewAdmin() {
  const { id } = useParams();
  const [reading, setReading] = useState<any>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(`Failed to fetch reading detail (${response.status}): ${detail}`);
        }
        const data = await response.json();
        setReading(data);
      } catch (error) {
        console.error("Failed to fetch reading detail:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const fetchQuestionCount = async () => {
      try {
        const response = await fetch(`${API_BASE}/${id}/questions/count`);
        if (!response.ok) {
          const detail = await response.text().catch(() => "");
          throw new Error(`Failed to fetch question count (${response.status}): ${detail}`);
        }
        const count = await response.json();
        setQuestionCount(count);
      } catch (error) {
        console.error("Failed to fetch question count:", error);
        setQuestionCount(null);
      }
    };

    fetchQuestionCount();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading material..." />
        </div>
      </div>
    );
  }

  if (!reading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Reading not found.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute description="Sign in to view admin reading materials.">
      <ReadingLayout reading={reading} backHref="/reading/admin">
      {/* Quiz Management Panel */}
      <Card variant="pressed" style={{ marginTop: "3rem", background: "var(--brand-soft)", borderColor: "var(--brand)" }}>
        <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 700, color: "var(--brand)" }}>
              Quiz Questions
            </h4>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {questionCount === null
                ? "Loading question count…"
                : questionCount === 0
                  ? "No questions yet — add some so students can be tested."
                  : `${questionCount} question${questionCount !== 1 ? "s" : ""} available for students.`}
            </p>
          </div>

          <Link href={`/reading/admin/reading/${id}/quiz`}>
            <Button variant="primary" pill leftIcon="📝">
              Manage Quiz
            </Button>
          </Link>
        </div>
      </Card>

      <ReadingForum readingId={id as string} />
      </ReadingLayout>
    </ProtectedRoute>
  );
}
