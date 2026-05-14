"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";
import ReadingForum from "@/app/reading/ReadingForum";

const API_BASE = "/api/reading-student";

export default function ReadingViewStudent() {
    const { id } = useParams();
    const router = useRouter();

    const [reading, setReading] = useState<any>(null);

    useEffect(() => {
        const fetchDetail = async () => {
            const response = await fetch(`${API_BASE}/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch reading detail");
            }
            const data = await response.json();
            setReading(data);
        };
        fetchDetail().catch((error) => {
            console.error("Failed to fetch reading detail:", error);
        });
    }, [id]);

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    return (
        <ReadingLayout
            reading={reading}
            backHref="/reading/student/readings"
        >
            <QuizSection
                onStart={() => {
                    router.push(
                        `/reading/student/readings/${reading.id}/quiz`
                    );
                }}
            />
            <ReadingForum readingId={id as string} />
        </ReadingLayout>
    );
}
