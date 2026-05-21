"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface Question {
  id: string;
  text: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  options: string[] | null;
  correctAnswer: string;
}

interface QuizQuestionRequest {
  text: string;
  questionType: string;
  options?: string[];
  correctAnswer: string;
}

const API_BASE = "/api/reading-admin";
const OPTION_LABELS = ["A", "B", "C", "D"] as const;

function getQuestionCountText(count: number): string {
  const suffix = count === 1 ? "" : "s";
  return `${count} question${suffix}`;
}

function getQuestionTypeLabel(type: string): string {
  if (type === "MULTIPLE_CHOICE") return "Multiple Choice";
  if (type === "TRUE_FALSE") return "True / False";
  return "Essay";
}

function getQuestionBadgeVariant(type: Question["questionType"]): BadgeVariant {
  if (type === "MULTIPLE_CHOICE") return "brand";
  if (type === "TRUE_FALSE") return "info";
  return "warning";
}

function getTrueFalseButtonStyle(correctAnswer: string, value: string): React.CSSProperties {
  const isSelected = correctAnswer === value;
  let border = "1px solid var(--border)";
  let background = "var(--surface)";
  let color = "var(--text-muted)";

  if (isSelected) {
    border = `2px solid ${value === "True" ? "var(--success)" : "var(--danger)"}`;
    background = value === "True" ? "var(--success-soft)" : "var(--danger-soft)";
    color = value === "True" ? "var(--success)" : "var(--danger)";
  }

  return {
    flex: 1,
    padding: "1rem",
    borderRadius: "var(--radius-md)",
    fontWeight: 700,
    fontSize: "1rem",
    border,
    background,
    color,
    cursor: "pointer",
    transition: "all 0.15s ease",
  };
}

function getSubmitButtonText(saving: boolean, hasInitial: boolean): string {
  if (saving) return "Saving…";
  return hasInitial ? "Update Question" : "Add Question";
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

function QuestionForm({
  initial,
  onSubmit,
  onCancel,
}: Readonly<{
  initial?: Question;
  onSubmit: (data: QuizQuestionRequest) => Promise<void>;
  onCancel: () => void;
}>) {
  const [text, setText] = useState(initial?.text ?? "");
  const [type, setType] = useState(initial?.questionType ?? "MULTIPLE_CHOICE");
  const [options, setOptions] = useState<string[]>(initial?.options ?? ["", "", "", ""]);
  const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filledOptions = options.filter((option) => option.trim());

  const handleOptionChange = (idx: number, val: string) => {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!text.trim()) return setError("Question text is required.");
    if (text.trim().length < 5) return setError("Question text must be at least 5 characters.");

    if (type === "MULTIPLE_CHOICE") {
      const filled = options.filter((o) => o.trim());
      if (filled.length < 2) return setError("At least 2 options are required.");
      if (!correctAnswer.trim()) return setError("Correct answer is required.");
    }
    if (type === "TRUE_FALSE" && !correctAnswer.trim()) {
      return setError("Select True or False.");
    }
    if (type === "ESSAY" && !correctAnswer.trim()) {
      return setError("Correct answer is required.");
    }

    setSaving(true);
    try {
      const payload: QuizQuestionRequest = {
        text,
        questionType: type,
        correctAnswer,
        ...(type === "MULTIPLE_CHOICE" ? { options: options.filter((o) => o.trim()) } : {}),
      };
      await onSubmit(payload);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <Textarea
          label="Question Text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your question here…"
          rows={3}
        />

        <div>
          <span className="yomu-input-label" style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Question Type
          </span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {(["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setCorrectAnswer("");
                  if (t === "MULTIPLE_CHOICE") setOptions(["", "", "", ""]);
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  border: type === t ? "2px solid var(--brand)" : "1px solid var(--border)",
                  background: type === t ? "var(--brand)" : "var(--surface)",
                  color: type === t ? "white" : "var(--text-muted)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                >
                  {getQuestionTypeLabel(t)}
                </button>
            ))}
          </div>
        </div>

        {type === "MULTIPLE_CHOICE" && (
          <div style={{ display: "grid", gap: "1rem" }}>
            <div>
              <span className="yomu-input-label" style={{ marginBottom: "0.5rem", display: "block" }}>
                Options (min. 2)
              </span>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {OPTION_LABELS.map((optionLabel, idx) => {
                  const opt = options[idx] ?? "";

                  return (
                  <div key={optionLabel} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "1.75rem", height: "1.75rem", borderRadius: "var(--radius-sm)",
                      background: "var(--surface-raised)", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: "0.75rem", fontWeight: 700, color: "var(--text-soft)",
                      flexShrink: 0,
                    }}>
                      {optionLabel}
                    </div>
                    <input
                      className="yomu-input"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${optionLabel}`}
                    />
                  </div>
                  );
                })}
              </div>
            </div>

            <div className="yomu-input-wrapper">
              <label className="yomu-input-label" htmlFor="quiz-correct-answer">Correct Answer</label>
              <select
                id="quiz-correct-answer"
                className="yomu-input"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
              >
                <option value="">Select correct option…</option>
                {filledOptions.map((option) => (
                  <option key={option} value={option}>
                    {String.fromCodePoint(65 + options.indexOf(option))}. {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {type === "TRUE_FALSE" && (
          <div>
            <span className="yomu-input-label" style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-soft)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Correct Answer
            </span>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["True", "False"].map((v) => (
                <button
                  key={v}
                  onClick={() => setCorrectAnswer(v)}
                  style={getTrueFalseButtonStyle(correctAnswer, v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === "ESSAY" && (
          <Input
            label="Correct Answer"
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            placeholder="Expected answer…"
          />
        )}

        {error && <div className="auth-error">{error}</div>}

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button variant="primary" pill loading={saving} onClick={handleSubmit}>
            {getSubmitButtonText(saving, !!initial)}
          </Button>
          <Button variant="ghost" pill onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
}

function QuestionCard({
  q,
  index,
  onEdit,
  onDelete,
}: Readonly<{
  q: Question;
  index: number;
  onEdit: (q: Question) => void;
  onDelete: (id: string) => void;
}>) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Card hoverable>
      <div style={{ display: "flex", alignItems: "start", gap: "1rem" }}>
        <div style={{
          width: "2rem", height: "2rem", borderRadius: "var(--radius-sm)",
          background: "var(--brand-soft)", color: "var(--brand)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: "0.85rem", flexShrink: 0,
        }}>
          {index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 0.5rem", fontWeight: 600, lineHeight: 1.4 }}>
            {q.text}
          </p>
          <Badge variant={getQuestionBadgeVariant(q.questionType)}>
            {q.questionType.replace("_", " ")}
          </Badge>

          {q.questionType === "MULTIPLE_CHOICE" && q.options && (
            <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.35rem" }}>
              {q.options.map((opt, i) => (
                <div
                  key={`${q.id}-${opt}`}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                    fontSize: "0.85rem",
                    background: opt === q.correctAnswer ? "var(--success-soft)" : "var(--surface-raised)",
                    color: opt === q.correctAnswer ? "var(--success)" : "var(--text-muted)",
                    fontWeight: opt === q.correctAnswer ? 600 : 400,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{String.fromCodePoint(65 + i)}.</span>
                  {opt}
                  {opt === q.correctAnswer && <span style={{ marginLeft: "auto" }}>✓</span>}
                </div>
              ))}
            </div>
          )}

          {q.questionType === "TRUE_FALSE" && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", fontWeight: 600, color: "var(--success)" }}>
              Answer: {q.correctAnswer}
            </p>
          )}

          {q.questionType === "ESSAY" && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Expected: <span style={{ fontWeight: 600, color: "var(--text)" }}>{q.correctAnswer}</span>
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
          <Button variant="ghost" size="sm" pill iconOnly onClick={() => onEdit(q)} title="Edit">
            ✏️
          </Button>
          {confirmDelete ? (
            <div style={{ display: "flex", gap: "0.25rem" }}>
              <Button variant="danger" size="sm" pill onClick={() => onDelete(q.id)}>Yes</Button>
              <Button variant="ghost" size="sm" pill onClick={() => setConfirmDelete(false)}>No</Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" pill iconOnly onClick={() => setConfirmDelete(true)} title="Delete">
              🗑️
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AdminQuizPage() {
  const params = useParams();
  const router = useRouter();
  const readingId = params?.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const fetchQuestions = useCallback(async () => {
    if (!readingId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Question[]>(`/${readingId}/questions`);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load questions.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [readingId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleAdd = async (data: QuizQuestionRequest) => {
    await apiFetch(`/${readingId}/questions`, { method: "POST", body: JSON.stringify(data) });
    setShowForm(false);
    fetchQuestions();
  };

  const handleUpdate = async (data: QuizQuestionRequest) => {
    if (!editingQuestion) return;
    await apiFetch(`/${readingId}/questions/${editingQuestion.id}`, { method: "PUT", body: JSON.stringify(data) });
    setEditingQuestion(null);
    fetchQuestions();
  };

  const handleDelete = async (questionId: string) => {
    await apiFetch(`/${readingId}/questions/${questionId}`, { method: "DELETE" });
    fetchQuestions();
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL questions for this reading? This cannot be undone.")) return;
    await apiFetch(`/${readingId}/questions`, { method: "DELETE" });
    fetchQuestions();
  };

  return (
    <ProtectedRoute description="Sign in to manage reading quizzes.">
      <div style={{ padding: "2rem 0 4rem" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <button
              onClick={() => router.back()}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}
            >
              ← Back to Reading
            </button>
            <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Quiz Management</h1>
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {loading ? "Loading…" : getQuestionCountText(questions.length)}
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {questions.length > 0 && (
              <Button variant="danger" size="sm" pill onClick={handleDeleteAll}>
                Delete All
              </Button>
            )}
            {!showForm && !editingQuestion && (
              <Button variant="primary" size="sm" pill leftIcon="+" onClick={() => setShowForm(true)}>
                Add Question
              </Button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ marginBottom: "1.5rem" }}>
            <QuestionForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
          </div>
        )}

        {error && <div className="auth-error" style={{ marginBottom: "1rem" }}>{error}</div>}

        {loading ? (
          <LoadingState message="Loading questions…" />
        ) : questions.length === 0 && !showForm ? (
          <EmptyState
            icon="📝"
            title="No Questions Yet"
            description='Click "Add Question" to create the first quiz question.'
          />
        ) : (
          <div style={{ display: "grid", gap: "1rem" }}>
            {questions.map((q, i) =>
              editingQuestion?.id === q.id ? (
                <QuestionForm
                  key={q.id}
                  initial={editingQuestion}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingQuestion(null)}
                />
              ) : (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  onEdit={(q) => { setShowForm(false); setEditingQuestion(q); }}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
