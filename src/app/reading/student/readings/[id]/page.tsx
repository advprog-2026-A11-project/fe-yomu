"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";

export default function ReadingViewStudent() {
    const { id } = useParams();
    const router = useRouter();

    const [reading, setReading] = useState<any>(null);
    const [isQuizCompleted, setIsQuizCompleted] = useState<boolean>(false);
    const userId = "user123";

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await ReadingAPI.getStudentReadingById(id as string, userId);
                setReading(data);

                // Jika API memiliki flag quizCompleted atau sejenisnya, gunakan itu
                if (data?.quizCompleted || data?.hasCompletedQuiz) {
                    setIsQuizCompleted(true);
                } else {
                    // Alternatif: Coba fetch questions, kalau 400 completed berarti sudah selesai
                    try {
                        await ReadingAPI.getQuizQuestions(id as string, userId);
                    } catch (e: any) {
                        if (e.message?.toLowerCase().includes("completed")) {
                            setIsQuizCompleted(true);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchDetail();
    }, [id]);

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    return (
        <ReadingLayout
            reading={reading}
            backHref="/reading/student/readings"
        >
            <QuizSection
                isCompleted={isQuizCompleted}
                onStart={() => {
                    router.push(
                        `/reading/student/readings/${reading.id}/quiz`
                    );
                }}
                onShowResult={() => {
                    // Navigate ke halaman hasil (jika belum ada endpoint, bisa ke halaman quiz yang sekarang akan tampil "Quiz Already Completed")
                    router.push(
                        `/reading/student/readings/${reading.id}/quiz`
                    );
                }}
            />
        </ReadingLayout>
    );
}