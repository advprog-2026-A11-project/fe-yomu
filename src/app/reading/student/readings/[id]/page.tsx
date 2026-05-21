"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";
import ReadingForum from "@/app/reading/ReadingForum";
import { LoadingState } from "@/components/ui/LoadingState";

const API_BASE = "/api/reading-student";

export default function ReadingViewStudent() {
  const { id } = useParams();
  const router = useRouter();
  const [reading, setReading] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`${API_BASE}/${id}`);
        if (!response.ok) throw new Error("Failed to fetch reading detail");
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

  if (loading) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container">
          <LoadingState message="Loading reading material..." />
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
    <ReadingLayout reading={reading} backHref="/reading/student/readings">
      <QuizSection
        onStart={() => {
          router.push(`/reading/student/readings/${reading.id}/quiz`);
        }}
      />
      <ReadingForum readingId={id as string} />
    </ReadingLayout>
  );
}
