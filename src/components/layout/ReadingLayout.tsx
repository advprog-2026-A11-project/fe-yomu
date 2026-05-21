"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getDifficultyConfig } from "@/utils/tiers";

export default function ReadingLayout({
  reading,
  backHref,
  children,
}: {
  reading: any;
  backHref: string;
  children?: React.ReactNode;
}) {
  const diffConfig = getDifficultyConfig(reading?.difficultyLevel || "");

  if (!reading) return null;

  return (
    <div style={{ padding: "2rem 0 4rem" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <Link href={backHref}>
            <Button variant="secondary" pill leftIcon="←">
              Back to List
            </Button>
          </Link>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {reading.category && <Badge variant="brand">{reading.category}</Badge>}
            {reading.difficultyLevel && (
              <Badge variant={
                reading.difficultyLevel === "BEGINNER" ? "success" :
                reading.difficultyLevel === "INTERMEDIATE" ? "warning" : "danger"
              }>
                {diffConfig.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        <h1 style={{ margin: "0 0 1.5rem", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", textAlign: "center" }}>
          {reading.title}
        </h1>

        {/* Content */}
        <Card padding="lg">
          <div
            style={{
              fontSize: "1.05rem",
              lineHeight: 1.8,
              color: "var(--text)",
              whiteSpace: "pre-wrap",
            }}
          >
            {reading.content}
          </div>
        </Card>

        {/* Extra Section (quiz, forum, etc) */}
        {children}
      </div>
    </div>
  );
}
