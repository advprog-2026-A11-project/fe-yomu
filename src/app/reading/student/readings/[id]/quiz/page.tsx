"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
        options: [
            "Environmental awareness",
            "Technology development",
            "Historical events",
            "Scientific research",
        ],
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

    const progress = useMemo(() => {
        return ((currentIndex + 1) / SAMPLE_QUESTIONS.length) * 100;
    }, [currentIndex]);

    const handleAnswer = (value: string) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
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
        console.log("Submitted Answers:", answers);
    };

    if (submitted) {
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
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-800 mb-3">
                        Quiz Submitted!
                    </h1>

                    <p className="text-slate-500 leading-relaxed mb-8">
                        Your answers have been submitted successfully. Great job completing
                        the reading quiz.
                    </p>

                    <button
                        onClick={() => router.push("/reading/student/readings")}
                        className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all"
                    >
                        Back to Readings
                    </button>
                </div>
            </div>
        );
    }

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

                        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                            <p className="text-xs text-slate-500 mb-1">Question</p>
                            <p className="text-lg font-bold text-slate-800">
                                {currentIndex + 1} / {SAMPLE_QUESTIONS.length}
                            </p>
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
              {currentQuestion.questionType.replace("_", " ")}
            </span>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800 leading-relaxed mb-8">
                        {currentQuestion.text}
                    </h2>

                    {currentQuestion.questionType === "MULTIPLE_CHOICE" && (
                        <div className="space-y-4">
                            {currentQuestion.options?.map((option, index) => {
                                const selected =
                                    answers[currentQuestion.id] === option;

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

                    {currentQuestion.questionType === "TRUE_FALSE" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {currentQuestion.options?.map((option) => {
                                const selected =
                                    answers[currentQuestion.id] === option;

                                return (
                                    <button
                                        key={option}
                                        onClick={() => handleAnswer(option)}
                                        className={`rounded-2xl border p-8 text-center transition-all ${
                                            selected
                                                ? option === "True"
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

                    {currentQuestion.questionType === "ESSAY" && (
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
                            disabled={currentIndex === 0}
                            className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            Previous
                        </button>

                        <div className="flex gap-3">
                            {currentIndex < SAMPLE_QUESTIONS.length - 1 ? (
                                <button
                                    onClick={nextQuestion}
                                    className="px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm"
                                >
                                    Next Question
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-all shadow-sm"
                                >
                                    Submit Quiz
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
                        {SAMPLE_QUESTIONS.map((question, index) => {
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
