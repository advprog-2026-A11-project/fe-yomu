"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReadingAPI } from "@/lib/readings";
import ReadingLayout from "@/components/layout/ReadingLayout";
import QuizSection from "@/components/layout/QuizSection";

export default function ReadingViewAdmin() {
    const { id } = useParams();
    const [reading, setReading] = useState<any>(null);
    const userId = "user123";

    useEffect(() => {
        const fetchDetail = async () => {
            const data = await ReadingAPI.getReadingById(
                id as string, userId
            );
            setReading(data)
        };
        fetchDetail();
    }, [id]);

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    return (
        <ReadingLayout
            reading={reading}
            backHref="/reading/admin"
        >
            {/* ADMIN QUIZ */}
            <QuizSection
                onStart={() => {
                    console.log("Start Quiz");
                }}
            />
        </ReadingLayout>
    );
}