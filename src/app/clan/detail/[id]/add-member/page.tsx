"use client";
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function AddMemberPage() {
    const { id } = useParams();
    const router = useRouter();
    const [score, setScore] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`http://localhost:8080/api/clan/${id}/add-member`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(score)
        });
        router.push(`/clan/detail/${id}`);
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold">Add Member Score</h2>
            <form onSubmit={handleSubmit} className="mt-4">
                <input type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} className="border p-2 mr-2" />
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Add Member</button>
            </form>
        </div>
    );
}