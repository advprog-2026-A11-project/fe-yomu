"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export default function ApplicantListPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [clan, setClan] = useState<any>(null);

    const refresh = async () => {
        const res = await fetch(`http://localhost:8080/api/clan/detail/${id}`);
        const data = await res.json();
        setClan(data);
    };

    useEffect(() => { refresh(); }, [id]);

    const handleDecision = async (applicantId: string, action: 'accept' | 'reject') => {
        await fetch(`http://localhost:8080/api/clan/${id}/${action}/${applicantId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        refresh();
    };

    if (!clan) return <div className="p-8 text-center">Loading Applicants...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Applicants for {clan.clanName}</h1>

            {clan.applicantIds?.length === 0 ? (
                <p className="text-gray-500">There are no pending applications for your clan right now.</p>
            ) : (
                <ul className="space-y-4">
                    {clan.applicantIds?.map((applicantId: string) => (
                        <li key={applicantId} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm">
                            <span className="font-mono text-lg">{applicantId}</span>
                            <div className="space-x-3">
                                <button onClick={() => handleDecision(applicantId, 'accept')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Accept</button>
                                <button onClick={() => handleDecision(applicantId, 'reject')} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Reject</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-8">
                <Link href={`/clan/detail/${id}`} className="text-blue-500 hover:underline">&larr; Back to Clan Detail</Link>
            </div>
        </div>
    );
}