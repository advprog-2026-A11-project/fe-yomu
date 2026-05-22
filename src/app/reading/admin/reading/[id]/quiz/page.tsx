"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
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

import { ReadingAPI } from "@/lib/readings";

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ type }: { type: string }) {
    const styles: Record<string, string> = {
        MULTIPLE_CHOICE: "bg-violet-100 text-violet-700",
        TRUE_FALSE: "bg-sky-100 text-sky-700",
        ESSAY: "bg-amber-100 text-amber-700",
    };
    const labels: Record<string, string> = {
        MULTIPLE_CHOICE: "Multiple Choice",
        TRUE_FALSE: "True / False",
        ESSAY: "Essay",
    };
    return (
        <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                styles[type] ?? "bg-gray-100 text-gray-600"
            }`}
        >
    {labels[type] ?? type}
    </span>
    );
}

// ─── Question Form (Add / Edit) ───────────────────────────────────────────────
interface QuestionFormProps {
    initial?: Question;
    onSubmit: (data: QuizQuestionRequest) => Promise<void>;
    onCancel: () => void;
}

function QuestionForm({ initial, onSubmit, onCancel }: QuestionFormProps) {
    const [text, setText] = useState(initial?.text ?? "");
    const [type, setType] = useState(initial?.questionType ?? "MULTIPLE_CHOICE");
    const [options, setOptions] = useState<string[]>(
        initial?.options ?? ["", "", "", ""]
    );
    const [correctAnswer, setCorrectAnswer] = useState(
        initial?.correctAnswer ?? ""
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOptionChange = (idx: number, val: string) => {
        setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!text.trim()) return setError("Question text is required.");

        if (text.trim().length < 5) {
            return setError("Question text must be at least 5 characters.");
        }

        if (type === "MULTIPLE_CHOICE") {
            const filled = options.filter((o) => o.trim());
            if (filled.length < 2) return setError("At least 2 options are required.");
            if (!correctAnswer.trim())
                return setError("Correct answer is required.");
        }
        if (type === "TRUE_FALSE") {
            if (!correctAnswer.trim())
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
                ...(type === "MULTIPLE_CHOICE"
                    ? { options: options.filter((o) => o.trim()) }
                    : {}),
            };
            await onSubmit(payload);
        } catch (e: any) {
            setError(e.message ?? "Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
            {/* Question text */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Question Text
                </label>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Write your question here…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
            </div>

            {/* Type selector */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Question Type
                </label>
                <div className="flex gap-3 flex-wrap">
                    {(["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"] as const).map(
                        (t) => (
                            <button
                                key={t}
                                onClick={() => {
                                    setType(t);
                                    setCorrectAnswer("");
                                    if (t === "MULTIPLE_CHOICE") setOptions(["", "", "", ""]);
                                }}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                    type === t
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                                }`}
                            >
                                {t === "MULTIPLE_CHOICE"
                                    ? "Multiple Choice"
                                    : t === "TRUE_FALSE"
                                        ? "True / False"
                                        : "Essay"}
                            </button>
                        )
                    )}
                </div>
            </div>

            {/* Options — Multiple Choice */}
            {type === "MULTIPLE_CHOICE" && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Options{" "}
                        <span className="text-gray-400 font-normal">(min. 2)</span>
                    </label>
                    <div className="space-y-2">
                        {options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                {String.fromCharCode(65 + idx)}
                </span>
                                <input
                                    value={opt}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Correct Answer
                        </label>
                        <select
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        >
                            <option value="">Select correct option…</option>
                            {options
                                .filter((o) => o.trim())
                                .map((o, idx) => {
                                    const letter = String.fromCharCode(65 + idx);
                                    return (
                                        <option key={idx} value={letter}>
                                            {letter}. {o}
                                        </option>
                                    );
                                })}
                        </select>
                    </div>
                </div>
            )}

            {/* Options — True / False */}
            {type === "TRUE_FALSE" && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Correct Answer
                    </label>
                    <div className="flex gap-3">
                        {["True", "False"].map((v) => (
                            <button
                                key={v}
                                onClick={() => setCorrectAnswer(v)}
                                className={`px-6 py-2 rounded-xl text-sm font-semibold border transition-all ${
                                    correctAnswer === v
                                        ? v === "True"
                                            ? "bg-emerald-500 text-white border-emerald-500"
                                            : "bg-rose-500 text-white border-rose-500"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Essay */}
            {type === "ESSAY" && (
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Correct Answer
                    </label>
                    <input
                        value={correctAnswer}
                        onChange={(e) => setCorrectAnswer(e.target.value)}
                        placeholder="Expected answer…"
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                </div>
            )}

            {/* Error */}
            {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-2.5">
                    {error}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm"
                >
                    {saving ? "Saving…" : initial ? "Update Question" : "Add Question"}
                </button>
                <button
                    onClick={onCancel}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}

// ─── Question Card ─────────────────────────────────────────────────────────────
interface QuestionCardProps {
    q: Question;
    index: number;
    onEdit: (q: Question) => void;
    onDelete: (id: string) => void;
}

function QuestionCard({ q, index, onEdit, onDelete }: QuestionCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5">
            <div className="flex items-start justify-between gap-4">
                {/* Number + badge */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
    <span className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 text-sm font-bold flex items-center justify-center">
        {index + 1}
        </span>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-snug mb-2">
                            {q.text}
                        </p>
                        <Badge type={q.questionType} />

                        {/* Options preview */}
                        {q.questionType === "MULTIPLE_CHOICE" && q.options && (
                            <ul className="mt-3 space-y-1">
                                {q.options.map((opt, i) => {
                                    const letter = String.fromCharCode(65 + i);
                                    return (
                                        <li
                                            key={i}
                                            className={`flex items-center gap-2 text-xs rounded-lg px-3 py-1.5 ${
                                                letter === q.correctAnswer
                                                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                                                    : "bg-gray-50 text-gray-600"
                                            }`}
                                        >
        <span className="font-bold">
            {letter}.
            </span>
                                            {opt}
                                            {letter === q.correctAnswer && (
                                                <span className="ml-auto">✓</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {/* True/False answer */}
                        {q.questionType === "TRUE_FALSE" && (
                            <p className="mt-2 text-xs text-emerald-600 font-semibold">
                                Answer: {q.correctAnswer}
                            </p>
                        )}

                        {/* Essay */}
                        {q.questionType === "ESSAY" && (
                            <p className="mt-2 text-xs text-gray-500">
                                Expected:{" "}
                                <span className="font-semibold text-gray-700">
            {q.correctAnswer}
            </span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={() => onEdit(q)}
                        className="p-2 rounded-xl text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                        title="Edit"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m-6 6l-1 4 4-1 6-6a2 2 0 00-2.828-2.828L9 13z" />
                        </svg>
                    </button>
                    {confirmDelete ? (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onDelete(q.id)}
                                className="text-xs px-2 py-1 rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700"
                            >
                                Yes
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold hover:bg-gray-200"
                            >
                                No
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-xl text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}



// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminQuizPage() {

    const params = useParams();
    const router = useRouter();
    const readingId = params?.id as string;


    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

    // ── Fetch ──
    const fetchQuestions = useCallback(async () => {
        if (!readingId) return;

        setLoading(true);
        setError(null);

        try {
            const data = await ReadingAPI.getAdminQuizQuestions(readingId);

            console.log("API RESPONSE:", data);

            setQuestions(Array.isArray(data) ? data : []);
        } catch (e: any) {
            console.error(e);

            setError(e.message ?? "Failed to load questions.");
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    }, [readingId]);

    useEffect(() => {
        fetchQuestions();
    }, [fetchQuestions]);

    // ── Handlers ──
    const handleAdd = async (data: QuizQuestionRequest) => {
        await ReadingAPI.createAdminQuizQuestion(readingId, data);
        setShowForm(false);
        fetchQuestions();
    };

    const handleUpdate = async (data: QuizQuestionRequest) => {
        if (!editingQuestion) return;
        await ReadingAPI.updateAdminQuizQuestion(readingId, editingQuestion.id, data);
        setEditingQuestion(null);
        fetchQuestions();
    };

    const handleDelete = async (questionId: string) => {
        await ReadingAPI.deleteAdminQuizQuestion(readingId, questionId);
        fetchQuestions();
    };

    const handleDeleteAll = async () => {
        if (!confirm("Delete ALL questions for this reading? This cannot be undone.")) return;
        await ReadingAPI.deleteAllAdminQuizQuestions(readingId);
        fetchQuestions();
    };

    // ── Render ──
    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-3xl mx-auto px-4">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-3 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Reading
                        </button>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            Quiz Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {loading
                                ? "Loading…"
                                : `${questions.length} question${questions.length !== 1 ? "s" : ""} in this reading`}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {questions.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2.5 text-sm font-semibold text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all"
                            >
                                Delete All
                            </button>
                        )}
                        {!showForm && !editingQuestion && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm hover:shadow-indigo-200 transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Add Question
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Add Form ── */}
                {showForm && (
                    <div className="mb-6">
                        <QuestionForm
                            onSubmit={handleAdd}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}

                {/* ── Error ── */}
                {error && (
                    <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl px-5 py-4 text-sm">
                        {error}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        Loading questions…
                    </div>
                ) : questions.length === 0 && !showForm ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                            </svg>
                        </div>
                        <p className="text-gray-500 font-medium mb-1">No questions yet</p>
                        <p className="text-sm text-gray-400">
                            Click "Add Question" to create the first quiz question.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
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
                                    onEdit={(q) => {
                                        setShowForm(false);
                                        setEditingQuestion(q);
                                    }}
                                    onDelete={handleDelete}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
