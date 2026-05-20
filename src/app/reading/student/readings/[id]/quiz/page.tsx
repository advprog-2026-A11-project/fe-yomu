"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";

interface Question {
    id: string;
    text: string;
    questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY" | string;
    options?: string[];
}

interface QuizSubmitResponse {
    score: number;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    timeTaken: number;
    questionResults: Record<string, boolean>;
}

export default function StudentQuizPage() {
    const router = useRouter();
    const params = useParams();
    const readingId = params.id as string;
    const userId = "user123"; // Or from auth provider/context

    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeTakenSeconds, setTimeTakenSeconds] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<QuizSubmitResponse | null>(null);

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
                        return; // Successfully got result, don't set error
                    } catch (resultErr) {
                        // Fallback to error popup if result fetching fails
                        console.error("Failed to fetch result:", resultErr);
                    }
                }
                setError(err.message || "Failed to load questions");
            } finally {
                setLoading(false);
            }
        };

        if (readingId) {
            fetchQuestions();
        }
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
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
        }
    };

    const previousQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);
            const payload = {
                answers,
                timeTakenSeconds,
            };
            const response = await ReadingAPI.submitQuiz(readingId, userId, payload);
            setResult(response);
            setSubmitted(true);
        } catch (err: any) {
            alert("Failed to submit quiz: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading quiz...</div>;
    }

    if (error) {
        const isCompleted = error.toLowerCase().includes("completed");
        
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-md w-full rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isCompleted ? 'bg-indigo-100 text-indigo-600' : 'bg-rose-100 text-rose-600'}`}>
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
                            ? "You have already taken the quiz for this reading material. Great job!" 
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

    if (questions.length === 0) {
        return <div className="min-h-screen flex items-center justify-center">No questions available.</div>;
    }

    if (submitted && result) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="bg-white max-w-xl w-full rounded-3xl shadow-lg border border-slate-200 p-10 text-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-emerald-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-800 mb-3">Quiz Submitted!</h1>

                    <div className="bg-slate-50 p-6 rounded-2xl mb-8 space-y-4 text-left border border-slate-100">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 font-medium">Score</span>
                            <span className="font-bold text-indigo-600">{result.score.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 font-medium">Accuracy</span>
                            <span className="font-bold text-indigo-600">{result.accuracy}%</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-slate-500 font-medium">Correct Answers</span>
                            <span className="font-bold text-slate-800">{result.correctAnswers} / {result.totalQuestions}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-medium">Time Taken</span>
                            <span className="font-bold text-slate-800">{result.timeTaken} seconds</span>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/reading/student/readings/${readingId}`)}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all w-full"
                    >
                        Back to Reading
                    </button>
                </div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">
                                Reading Quiz
                            </p>
                            <h1 className="text-3xl font-bold text-slate-900 mt-1">
                                Reading Comprehension Test
                            </h1>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm flex flex-col items-center">
                                <p className="text-xs text-slate-500 mb-1">Time</p>
                                <p className="text-lg font-bold text-slate-800">
                                    {formatTime(timeTakenSeconds)}
                                </p>
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
                        <div
                            className="h-full bg-indigo-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
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
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                                                    selected
                                                        ? "bg-indigo-600 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
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
                                        <p className="text-2xl font-bold text-slate-800">
                                            {option}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {currentQuestion?.questionType === "ESSAY" && (
                        <div>
                            <textarea
                                rows={6}
                                value={answers[currentQuestion.id] || ""}
                                onChange={(e) => handleAnswer(e.target.value)}
                                placeholder="Write your answer here..."
                                className="w-full rounded-2xl border border-slate-200 px-5 py-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            />
                        </div>
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
                    <h3 className="text-lg font-bold text-slate-800 mb-4">
                        Quiz Navigation
                    </h3>

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
