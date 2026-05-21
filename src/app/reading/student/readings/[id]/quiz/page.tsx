"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";

interface Question {
  id: string;
  text: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  options?: string[];
}

const SAMPLE_QUESTIONS: Question[] = [
  {
    id: "1",
    text: "What is the main idea of the passage?",
    questionType: "MULTIPLE_CHOICE",
    options: ["Environmental awareness", "Technology development", "Historical events", "Scientific research"],
  },
  {
    id: "2",
    text: "The writer agrees that reading daily improves comprehension.",
    questionType: "TRUE_FALSE",
    options: ["True", "False"],
  },
  {
    id: "3",
    text: "Write one benefit of reading books regularly.",
    questionType: "ESSAY",
  },
];

export default function StudentQuizPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = SAMPLE_QUESTIONS[currentIndex];
  const progress = useMemo(() => ((currentIndex + 1) / SAMPLE_QUESTIONS.length) * 100, [currentIndex]);

  const handleAnswer = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const nextQuestion = () => {
    if (currentIndex < SAMPLE_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: "4rem 0" }}>
        <div className="container" style={{ maxWidth: "600px" }}>
          <Card variant="raised" padding="lg" style={{ textAlign: "center" }}>
            <div style={{
              width: "5rem", height: "5rem", borderRadius: "50%",
              background: "var(--success-soft)", display: "flex",
              alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem", fontSize: "2.5rem",
            }}>
              ✓
            </div>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 800 }}>Quiz Submitted!</h1>
            <p style={{ margin: "0 0 2rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
              Your answers have been submitted successfully. Great job completing the reading quiz.
            </p>
            <Button variant="primary" size="lg" pill onClick={() => router.push("/reading/student/readings")}>
              Back to Readings
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem 0 4rem" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <div>
              <p className="yomu-eyebrow">Reading Quiz</p>
              <h1 style={{ margin: "0.25rem 0 0", fontSize: "1.75rem", fontWeight: 800 }}>Reading Comprehension Test</h1>
            </div>
            <Badge variant="brand" size="lg">
              {currentIndex + 1} / {SAMPLE_QUESTIONS.length}
            </Badge>
          </div>
          <Progress value={progress} max={100} color="brand" size="md" />
        </div>

        {/* Question Card */}
        <Card variant="raised" padding="lg">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <div style={{
              width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius-md)",
              background: "var(--brand-soft)", color: "var(--brand)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: "1rem",
            }}>
              {currentIndex + 1}
            </div>
            <Badge>{currentQuestion.questionType.replace("_", " ")}</Badge>
          </div>

          <h2 style={{ margin: "0 0 2rem", fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.5 }}>
            {currentQuestion.text}
          </h2>

          {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              {currentQuestion.options?.map((option, index) => {
                const selected = answers[currentQuestion.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    style={{
                      display: "flex", alignItems: "center", gap: "1rem",
                      width: "100%", textAlign: "left", padding: "1rem 1.25rem",
                      border: selected ? "2px solid var(--brand)" : "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      background: selected ? "var(--brand-soft)" : "var(--surface)",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{
                      width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-sm)",
                      background: selected ? "var(--brand)" : "var(--surface-raised)",
                      color: selected ? "white" : "var(--text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
                    }}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span style={{ fontWeight: 600, color: selected ? "var(--brand)" : "var(--text)" }}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.questionType === "TRUE_FALSE" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
              {currentQuestion.options?.map((option) => {
                const selected = answers[currentQuestion.id] === option;
                const isTrue = option === "True";
                return (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    style={{
                      padding: "2rem", textAlign: "center",
                      border: selected ? `2px solid ${isTrue ? "var(--success)" : "var(--danger)"}` : "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      background: selected ? (isTrue ? "var(--success-soft)" : "var(--danger-soft)") : "var(--surface)",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: selected ? (isTrue ? "var(--success)" : "var(--danger)") : "var(--text)" }}>
                      {option}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {currentQuestion.questionType === "ESSAY" && (
            <Textarea
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Write your answer here..."
              rows={6}
            />
          )}

          {/* Navigation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <Button variant="secondary" pill onClick={previousQuestion} disabled={currentIndex === 0}>
              ← Previous
            </Button>

            {currentIndex < SAMPLE_QUESTIONS.length - 1 ? (
              <Button variant="primary" pill onClick={nextQuestion}>
                Next Question →
              </Button>
            ) : (
              <Button variant="success" pill onClick={handleSubmit}>
                Submit Quiz ✓
              </Button>
            )}
          </div>
        </Card>

        {/* Quiz Navigation Dots */}
        <Card style={{ marginTop: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>Quiz Navigation</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {SAMPLE_QUESTIONS.map((question, index) => {
              const answered = !!answers[question.id];
              const active = currentIndex === index;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    width: "2.75rem", height: "2.75rem", borderRadius: "var(--radius-md)",
                    fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
                    border: "none",
                    background: active ? "var(--brand)" : answered ? "var(--success-soft)" : "var(--surface-raised)",
                    color: active ? "white" : answered ? "var(--success)" : "var(--text-muted)",
                    transition: "all 0.15s ease",
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
