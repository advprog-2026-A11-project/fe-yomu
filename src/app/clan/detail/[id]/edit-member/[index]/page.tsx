"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function EditMemberPage() {
    const { id, index } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [score, setScore] = useState(Number(searchParams.get('score')) || 0);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`http://localhost:8080/api/clan/${id}/edit-member/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: score })
        });
        router.push(`/clan/detail/${id}`);
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold">Edit Member {Number(index) + 1} Score</h2>
            <form onSubmit={handleUpdate} className="mt-4">
                <input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} className="border p-2 mr-2" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update Score</button>
            </form>
        </div>
    );
}