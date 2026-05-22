"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";

export interface QuizResultDetail {
    questionId: string;
    questionText: string;
    questionType: string;
    options: string[];
    userAnswer: string | null;
    correctAnswer: string;
    correct: boolean;
}

export interface QuizResult {
    readingId: string;
    score: number;
    accuracy: number;
    totalQuestions: number;
    correctAnswers: number;
    completedAt: string;
    questionDetails: QuizResultDetail[];
}

export default function ReadingViewStudent() {
    const { id } = useParams();
    const router = useRouter();

    const [reading, setReading] = useState<any>(null);
    const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [loadingResult, setLoadingResult] = useState(false);

    // TODO: ganti dengan userId dari auth context/provider
    const userId = "user123";

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await ReadingAPI.getStudentReadingById(id as string, userId);
                setReading(data);
            } catch (err) {
                console.error(err);
            }
        };

        const checkQuizStatus = async () => {
            try {
                // Coba ambil hasil quiz — jika berhasil, berarti sudah dikerjakan
                const result = await ReadingAPI.getQuizResult(id as string, userId);
                setQuizResult(result);
                setIsQuizCompleted(true);
            } catch {
                // Jika gagal (belum dikerjakan), biarkan isQuizCompleted = false
                setIsQuizCompleted(false);
            }
        };

        fetchDetail();
        checkQuizStatus();
    }, [id]);

    const handleShowResult = async () => {
        if (quizResult) {
            setShowResultModal(true);
            return;
        }
        // Fallback: fetch ulang jika belum ada di state
        try {
            setLoadingResult(true);
            const result = await ReadingAPI.getQuizResult(id as string, userId);
            setQuizResult(result);
            setShowResultModal(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingResult(false);
        }
    };

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    return (
        <>
            <ReadingLayout reading={reading} backHref="/reading/student/readings">
                <QuizSection
                    isCompleted={isQuizCompleted}
                    loadingResult={loadingResult}
                    onStart={() => {
                        router.push(`/reading/student/readings/${reading.id}/quiz`);
                    }}
                    onShowResult={handleShowResult}
                />
            </ReadingLayout>

            {/* Modal Hasil Quiz */}
            {showResultModal && quizResult && (
                <QuizResultModal
                    result={quizResult}
                    onClose={() => setShowResultModal(false)}
                />
            )}
        </>
    );
}

/* ─────────────────────────────────────────────
   Modal Hasil Quiz
───────────────────────────────────────────── */
function QuizResultModal({
                             result,
                             onClose,
                         }: {
    result: QuizResult;
    onClose: () => void;
}) {
    const scoreColor =
        result.score >= 80
            ? "text-emerald-600"
            : result.score >= 60
                ? "text-amber-500"
                : "text-rose-500";

    const scoreBg =
        result.score >= 80
            ? "bg-emerald-50 border-emerald-200"
            : result.score >= 60
                ? "bg-amber-50 border-amber-200"
                : "bg-rose-50 border-rose-200";

    const completedDate = new Date(result.completedAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
        >
            <div
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: "90vh" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Quiz Result</h2>
                        <p className="text-sm text-slate-400 mt-0.5">Completed on {completedDate}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Score summary */}
                <div className={`mx-8 mt-6 rounded-2xl border p-5 ${scoreBg} flex items-center justify-between flex-wrap gap-4`}>
                    <div className="flex items-center gap-4">
                        <div className={`text-5xl font-black ${scoreColor}`}>{result.score}</div>
                        <div className="text-slate-500 text-sm leading-relaxed">
                            <div className="font-semibold text-slate-700">
                                {result.correctAnswers} / {result.totalQuestions} correct
                            </div>
                            <div>Accuracy: {(result.accuracy <= 1 ? result.accuracy * 100 : result.accuracy).toFixed(1)}%</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {["🥇", "🥈", "🥉"].map((medal, i) => (
                            <span
                                key={i}
                                className={`text-2xl transition-opacity ${
                                    result.score >= 80 && i === 0
                                        ? "opacity-100"
                                        : result.score >= 60 && i === 1
                                            ? "opacity-100"
                                            : result.score < 60 && i === 2
                                                ? "opacity-100"
                                                : "opacity-20"
                                }`}
                            >
                                {medal}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Question breakdown — scrollable */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                        Answer Breakdown
                    </h3>

                    {result.questionDetails.map((detail, index) => (
                        <QuestionReviewCard key={detail.questionId} detail={detail} index={index} />
                    ))}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-semibold transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuestionReviewCard({
                                detail,
                                index,
                            }: {
    detail: QuizResultDetail;
    index: number;
}) {
    return (
        <div
            className={`rounded-2xl border p-5 ${
                detail.correct
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-rose-200 bg-rose-50"
            }`}
        >
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4">
                <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        detail.correct
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
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
                                detail.correct
                                    ? "bg-emerald-200 text-emerald-700"
                                    : "bg-rose-200 text-rose-700"
                            }`}
                        >
                            {detail.correct ? "✓ Correct" : "✗ Incorrect"}
                        </span>
                    </div>
                    <p className="font-semibold text-slate-800 leading-snug">
                        {detail.questionText}
                    </p>
                </div>
            </div>

            {/* Answer comparison */}
            <div className="space-y-2 pl-11">
                {/* Options for multiple choice / true-false */}
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
