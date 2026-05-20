"use client";

import Link from "next/link";

export default function ReadingLayout({
                                          reading,
                                          backHref,
                                          children,
                                      }: {
    reading: any;
    backHref: string;
    children?: React.ReactNode;
}) {
    const difficultyColor: Record<string, string> = {
        BEGINNER: "bg-emerald-100 text-emerald-700",
        INTERMEDIATE: "bg-amber-100 text-amber-700",
        ADVANCED: "bg-rose-100 text-rose-700",
    };

    if (!reading) return null;

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-3xl mx-auto px-6 py-12">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-10">

                    <Link
                        href={backHref}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-orange-400 hover:bg-orange-500 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Back to List
                    </Link>

                    <div className="flex gap-3">
                        <span className="px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase">
                          {reading.category}
                        </span>
                            <span
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${
                                    difficultyColor[reading.difficultyLevel]
                                }`}
                            >
                          {reading.difficultyLevel}
                        </span>
                    </div>
                </div>

                {/* TITLE */}
                <h1 className="text-4xl font-extrabold text-center mb-8">
                    {reading.title}
                </h1>

                {/* CONTENT */}
                <div className="prose prose-lg whitespace-pre-wrap text-gray-700">
                    {reading.content}
                </div>

                {/* EXTRA SECTION (quiz, dll) */}
                {children}
            </div>
        </div>
    );
}