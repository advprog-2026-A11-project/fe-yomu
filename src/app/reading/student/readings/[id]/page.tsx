"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";
import {
    AnswerBreakdown,
    formatQuizCompletedDate,
    QuizResultMeta,
    QuizScoreSummary,
    type QuizResult,
} from "@/components/reading/quiz-result";

export default function ReadingViewStudent() {
    const { id } = useParams();
    const router = useRouter();

    const [reading, setReading] = useState<any>(null);
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [showResultModal, setShowResultModal] = useState(false);
    const [loadingResult, setLoadingResult] = useState(false);

    useEffect(() => {
        async function fetchDetail() {
            try {
                setReading(await ReadingAPI.getStudentReadingById(id as string));
            } catch (err) {
                console.error(err);
            }
        }

        async function checkQuizStatus() {
            try {
                const result = await ReadingAPI.getQuizResult(id as string);
                setQuizResult(result);
                setIsQuizCompleted(true);
            } catch {
                setIsQuizCompleted(false);
            }
        }

        fetchDetail();
        checkQuizStatus();
    }, [id]);

    const handleShowResult = async () => {
        if (quizResult) {
            setShowResultModal(true);
            return;
        }

        try {
            setLoadingResult(true);
            const result = await ReadingAPI.getQuizResult(id as string);
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
                    onStart={() => router.push(`/reading/student/readings/${reading.id}/quiz`)}
                    onShowResult={handleShowResult}
                />
            </ReadingLayout>

            {showResultModal && quizResult && (
                <QuizResultModal result={quizResult} onClose={() => setShowResultModal(false)} />
            )}
        </>
    );
}

function QuizResultModal({
    result,
    onClose,
}: Readonly<{
    result: QuizResult;
    onClose: () => void;
}>) {
    const completedDate = formatQuizCompletedDate(result.completedAt);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
        >
            <div
                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                style={{ maxHeight: "90vh" }}
            >
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

                <QuizScoreSummary result={result} showMedals className="mx-8 mt-6" />

                <div className="mx-8 mt-4">
                    <QuizResultMeta completedAt={result.completedAt} timeTakenSeconds={result.timeTakenSeconds} />
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <AnswerBreakdown details={result.questionDetails} />
                </div>

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
