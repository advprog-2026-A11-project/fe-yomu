"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ReadingAPI } from "@/lib/readings";
import ReadingLayout from "@/components/layout/ReadingLayout";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_BACAAN_QUIZ_URL ?? "";

export default function ReadingViewAdmin() {
    const { id } = useParams();
    const router = useRouter();
    const [reading, setReading] = useState<any>(null);
    const [questionCount, setQuestionCount] = useState<number | null>(null);
    const userId = "user123";

    useEffect(() => {
        const fetchDetail = async () => {
            const data = await ReadingAPI.getReadingById(id as string, userId);
            setReading(data);
        };
        fetchDetail();
    }, [id]);

    useEffect(() => {
        if (!id) return;
        fetch(`${API_BASE}/api/admin/readings/${id}/questions/count`)
            .then((r) => r.json())
            .then((n) => setQuestionCount(n))
            .catch(() => setQuestionCount(null));
    }, [id]);

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    return (
        <ReadingLayout reading={reading} backHref="/reading/admin">
            {/* ── Quiz Management Panel ── */}
            <div className="mt-12 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h4 className="font-bold text-indigo-900 text-lg mb-1">
                            Quiz Questions
                        </h4>
                        <p className="text-indigo-600 text-sm">
                            {questionCount === null
                                ? "Loading question count…"
                                : questionCount === 0
                                    ? "No questions yet — add some so students can be tested."
                                    : `${questionCount} question${questionCount !== 1 ? "s" : ""} available for students.`}
                        </p>
                    </div>

                    <Link
                        href={`/reading/admin/reading/${id}/quiz`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                        </svg>
                        Manage Quiz
                    </Link>
                </div>

                {/* Quick stats */}
                {questionCount !== null && questionCount > 0 && (
                    <div className="mt-4 pt-4 border-t border-indigo-100">
                        <p className="text-xs text-indigo-500">
                            Students who finish reading will see a quiz prompt. Click "Manage Quiz" to add, edit, or remove questions.
                        </p>
                    </div>
                )}
            </div>
        </ReadingLayout>
    );
}
