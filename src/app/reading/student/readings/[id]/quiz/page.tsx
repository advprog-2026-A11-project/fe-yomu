"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import type { QuizResultDetail, QuizResult } from "@/app/reading/student/readings/[id]/page";

interface Question {
    id: string;
    text: string;
    questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" | string;
    options?: string[];
}

export default function StudentQuizPage() {
    const router = useRouter();
    const params = useParams();
    const readingId = params.id as string;
    // TODO: ganti dengan userId dari auth context/provider
    const userId = "user123";

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizResult | null>(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const data = await ReadingAPI.getQuizQuestions(readingId, userId);
                setQuestions(data);
            } catch (err: any) {
                if (err.message?.toLowerCase().includes("completed")) {
                    try {
                        const resultData = await ReadingAPI.getQuizResult(readingId, userId);
                        setResult(resultData);
                        setSubmitted(true);
                        setLoading(false);
                        return;
                    } catch (resultErr) {
                        console.error("Failed to fetch result:", resultErr);
                    }
                }
                setError(err.message || "Failed to load questions");
            } finally {
                setLoading(false);
            }
        };

        if (readingId) fetchQuestions();
    }, [readingId, userId]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (!loading && !submitted && questions.length > 0) {
            timer = setInterval(() => {
                setTimeTakenSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [loading, submitted, questions.length]);

    const currentQuestion = questions[currentIndex];

    const progress = useMemo(() => {
        if (questions.length === 0) return 0;
        return ((currentIndex + 1) / questions.length) * 100;
    }, [currentIndex, questions.length]);

    const handleAnswer = (value: string) => {
        if (!currentQuestion) return;
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) setCurrentIndex((prev) => prev + 1);
    };

    const previousQuestion = () => {
        if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const submitResponse = await ReadingAPI.submitQuiz(readingId, userId, {
                answers,
                timeTakenSeconds,
            });

            // Setelah submit, langsung fetch hasil lengkap dengan jawaban benar
            try {
                const fullResult = await ReadingAPI.getQuizResult(readingId, userId);
                setResult(fullResult);
            } catch {
                // Fallback: konversi submitResponse ke format QuizResult minimal
                setResult({
                    readingId,
                    score: submitResponse.score,
                    accuracy: submitResponse.accuracy,
                    totalQuestions: submitResponse.totalQuestions,
                    correctAnswers: submitResponse.correctAnswers,
                    completedAt: new Date().toISOString(),
                    questionDetails: [],
                });
            }
            setSubmitted(true);
        } catch (err: any) {
            alert("Failed to submit quiz: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    /* ─── Loading ─── */
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Loading quiz...
            </div>
        );
    }

    /* ─── Error ─── */
    if (error) {
        const isCompleted = error.toLowerCase().includes("completed");
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
                    <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                            isCompleted ? "bg-indigo-100 text-indigo-600" : "bg-rose-100 text-rose-600"
                        }`}
                    >
                        {isCompleted ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-3">
                        {isCompleted ? "Quiz Already Completed" : "Oops! Something went wrong"}
                    </h2>
                    <p className="text-slate-500 mb-8">
                        {isCompleted
                            ? "You have already taken the quiz for this reading material. Go back to see your result."
                            : error.replace(/API Error: \d+ - /, "")}
                    </p>
                    <button
                        onClick={() => router.push(`/reading/student/readings/${readingId}`)}
                        className="px-6 py-3 w-full rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm"
                    >
                        Back to Reading
                    </button>
                </div>
            </div>
        );
    }

    /* ─── No questions ─── */
    if (questions.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                No questions available.
            </div>
        );
    }

    /* ─── Result setelah submit ─── */
    if (submitted && result) {
        const scoreColor =
            result.score >= 80 ? "text-emerald-600" : result.score >= 60 ? "text-amber-500" : "text-rose-500";
        const scoreBg =
            result.score >= 80
                ? "bg-emerald-50 border-emerald-200"
                : result.score >= 60
                    ? "bg-amber-50 border-amber-200"
                    : "bg-rose-50 border-rose-200";

        return (
            <div className="min-h-screen bg-slate-50 py-10 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Score card */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mb-1">Quiz Submitted!</h1>
                        <p className="text-slate-400 text-sm mb-6">
                            {new Date(result.completedAt).toLocaleDateString("id-ID", {
                                day: "numeric", month: "long", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                            })}
                        </p>

                        <div className={`rounded-2xl border p-5 ${scoreBg} flex items-center justify-between flex-wrap gap-4 text-left mb-6`}>
                            <div className="flex items-center gap-4">
                                <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
                                <div className="text-sm text-slate-500 leading-relaxed">
                                    <div className="font-semibold text-slate-700">
                                        {result.correctAnswers} / {result.totalQuestions} correct
                                    </div>
                                    <div>Accuracy: {(result.accuracy * 100).toFixed(1)}%</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100 mb-6 text-sm text-slate-600">
                            <div className="flex justify-between py-1 border-b border-slate-100">
                                <span>Time Taken</span>
                                <span className="font-semibold">{formatTime(timeTakenSeconds || 0)}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(`/reading/student/readings/${readingId}`)}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all w-full"
                        >
                            Back to Reading
                        </button>
                    </div>

                    {/* Per-question breakdown — hanya tampil jika ada data */}
                    {result.questionDetails && result.questionDetails.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider px-1">
                                Answer Breakdown
                            </h3>
                            {result.questionDetails.map((detail, index) => (
                                <AnswerReviewCard key={detail.questionId} detail={detail} index={index} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Quiz form ─── */
    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Reading Quiz</p>
                            <h1 className="text-3xl font-bold text-slate-900 mt-1">Reading Comprehension Test</h1>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
                                <p className="text-xs text-slate-500 mb-1">Time</p>
                                <p className="text-lg font-bold text-slate-800">{formatTime(timeTakenSeconds)}</p>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
                                <p className="text-xs text-slate-500 mb-1">Question</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {currentIndex + 1} / {questions.length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            {currentIndex + 1}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wide">
                            {currentQuestion?.questionType?.replace("_", " ") || "QUESTION"}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">
                        {currentQuestion?.text}
                    </h2>

                    {currentQuestion?.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-4">
                            {currentQuestion.options?.map((option, index) => {
                                const selected = answers[currentQuestion.id] === option;
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswer(option)}
                                        className={`w-full text-left rounded-2xl border p-5 transition-all ${
                                            selected
                                                ? "border-indigo-600 bg-indigo-50"
                                                : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${selected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                                {String.fromCharCode(65 + index)}
                                            </div>
                                            <p className="font-medium text-slate-700">{option}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {currentQuestion?.questionType === "TRUE_FALSE" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentQuestion.options?.map((option) => {
                                const selected = answers[currentQuestion.id] === option;
                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswer(option)}
                                        className={`rounded-2xl border p-8 text-center transition-all ${
                                            selected
                                                ? option.toLowerCase() === "true"
                                                    ? "border-emerald-500 bg-emerald-50"
                                                    : "border-rose-500 bg-rose-50"
                                                : "border-slate-200 hover:border-slate-300"
                                        }`}
                                    >
                                        <p className="text-2xl font-bold text-slate-800">{option}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {currentQuestion?.questionType === "ESSAY" && (
                        <textarea
                            rows={6}
                            value={answers[currentQuestion.id] || ""}
                            onChange={(e) => handleAnswer(e.target.value)}
                            placeholder="Write your answer here..."
                            className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    )}

                    <div className="flex items-center justify-between mt-10 gap-4 flex-wrap">
                        <button
                            onClick={previousQuestion}
                            disabled={currentIndex === 0 || submitting}
                            className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>
                        <div className="flex gap-3">
                            {currentIndex < questions.length - 1 ? (
                                <button
                                    onClick={nextQuestion}
                                    disabled={submitting}
                                    className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm disabled:opacity-50"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75"
                                >
                                    {submitting ? "Submitting..." : "Submit Quiz"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Quiz Navigation</h3>
                    <div className="flex flex-wrap gap-3">
                        {questions.map((question, index) => {
                            const answered = !!answers[question.id];
                            const active = currentIndex === index;
                            return (
                                <button
                                    key={question.id}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                                        active
                                            ? "bg-indigo-600 text-white"
                                            : answered
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Komponen review jawaban per soal (reusable)
───────────────────────────────────────────── */
function AnswerReviewCard({ detail, index }: { detail: QuizResultDetail; index: number }) {
    return (
        <div
            className={`rounded-2xl border p-5 ${
                detail.correct ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
            }`}
        >
            <div className="flex items-start gap-3 mb-4">
                <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        detail.correct ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                    }`}
                >
                    {index + 1}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {detail.questionType.replace("_", " ")}
                        </span>
                        <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                detail.correct ? "bg-emerald-200 text-emerald-700" : "bg-rose-200 text-rose-700"
                            }`}
                        >
                            {detail.correct ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                    </div>
                    <p className="font-semibold text-slate-800 leading-snug">{detail.questionText}</p>
                </div>
            </div>

            <div className="space-y-2 pl-11">
                {detail.options && detail.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {detail.options.map((opt) => {
                            const isCorrect = opt.trim().toUpperCase() === detail.correctAnswer?.trim().toUpperCase();
                            const isUserAnswer = opt.trim().toUpperCase() === detail.userAnswer?.trim().toUpperCase();
                            return (
                                <span
                                    key={opt}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                                        isCorrect
                                            ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                                            : isUserAnswer && !isCorrect
                                                ? "bg-rose-100 border-rose-400 text-rose-700"
                                                : "bg-white border-slate-200 text-slate-500"
                                    }`}
                                >
                                    {opt}
                                    {isCorrect && " ✓"}
                                    {isUserAnswer && !isCorrect && " ✗"}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-slate-200">
                        <p className="text-xs text-slate-400 mb-0.5">Your answer</p>
                        <p className={`font-semibold text-sm ${detail.correct ? "text-emerald-600" : "text-rose-600"}`}>
                            {detail.userAnswer ?? <span className="italic text-slate-400">No answer</span>}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl px-4 py-2.5 border border-emerald-200">
                        <p className="text-xs text-slate-400 mb-0.5">Correct answer</p>
                        <p className="font-semibold text-sm text-emerald-600">{detail.correctAnswer}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
