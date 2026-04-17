"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import ReadingForum from "../../ReadingForum";

const API_STUDENT = "http://localhost:8082/api/student/readings";

export default function ReadingView() {
    const { id } = useParams();
    const [reading, setReading] = useState<any>(null);
    const userId = "user123";

    useEffect(() => {
        const fetchDetail = async () => {
            const response = await fetch(`${API_STUDENT}/${id}`, {
                headers: { "userId": userId}
            });

            if (response.ok) {
                const data = await response.json();
                setReading(data);
            }
        };
        fetchDetail();
    }, [id]);

    if (!reading) return <div className="p-10 text-center">Loading material...</div>;

    const difficultyColor = {
        BEGINNER: "bg-emerald-100 text-emerald-700",
        INTERMEDIATE: "bg-amber-100 text-amber-700",
        ADVANCED: "bg-rose-100 text-rose-700"
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-12">
                {/* Container Utama untuk Header Navigasi */}
                <div className="flex justify-between items-center mb-10">

                    {/* Sisi Kiri: Tombol Back */}
                    <Link
                        href="/reading/student/readings"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-400 hover:bg-orange-500 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Back to List
                    </Link>

                    {/* Sisi Kanan: Grup Badge (Category & Difficulty) */}
                    <div className="flex gap-3">
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {reading.category}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-semibold ${difficultyColor[reading.difficultyLevel as keyof typeof difficultyColor]}`}>
                            {reading.difficultyLevel}
                        </span>
                    </div>
                </div>

                <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">{reading.title}</h1>

                <div className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {reading.content}
                </div>

                <div className="mt-12 p-8 bg-green-50 rounded-2xl text-center">
                    <h4 className="font-bold text-green-900 mb-2">Finish reading?</h4>
                    <p className="text-green-700 mb-6 text-sm">Let's test your knowledge by taking this quiz.</p>
                    <button className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-all
                    shadow-lg shadow-green-200 active:scale-95">
                        Start Quiz
                    </button>
                </div>

                {/* Forum Section */}
                {id && typeof id === 'string' && <ReadingForum readingId={id} />}
            </div>
        </div>
    );
}