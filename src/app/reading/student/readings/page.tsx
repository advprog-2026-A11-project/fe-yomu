"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_STUDENT = `${process.env.NEXT_PUBLIC_BACKEND_BACAAN_QUIZ_URL}/api/student/readings`;
const USER_ID = "user-123";

export default function StudentReadingPage() {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReadings = async () => {
            try {
                const response = await fetch (API_STUDENT, {
                    method: "GET",
                    headers: {
                        "userId": USER_ID,
                        "Content-Type": "application/json",
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setReadings(data);
                }
            } catch (error) {
                console.error("Failed to load readings: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReadings();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl">
                        Reading <span className="text-orange-500">Materials</span>
                    </h1>
                    <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
                        Discover a reading that excites you today and take your comprehension to the next level!
                    </p>
                </header>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {readings.map((reading: any) => (
                        <ReadingCard key={reading.id} reading={reading} />
                    ))}
                </div>

                {readings.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-200">
                        <p className="text-slate-400 text-lg">There's not material yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function ReadingCard({ reading }: {reading: any}) {
    const difficultyColor = {
        BEGINNER: "bg-emerald-100 text-emerald-700",
        INTERMEDIATE: "bg-amber-100 text-amber-700",
        ADVANCED: "bg-rose-100 text-rose-700"
    };

    return (
        <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
                {/* Badge Category */}
                <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">
                        {reading.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${difficultyColor[reading.difficultyLevel as keyof typeof difficultyColor]}`}>
                        {reading.difficultyLevel}
                    </span>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-orange-400 transition-colors">
                    {reading.title}
                </h3>

                <p className="text-slate-500 text-sm line-clamp-3 mb-4">
                    {reading.content}
                </p>
            </div>

            <div className="p-6 pt-0">
                <Link
                    href={`/reading/student/readings/${reading.id}`}
                    className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-400 hover:bg-orange-500 transition-colors shadow-sm"
                >
                    Start Reading
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}