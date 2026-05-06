"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export default function ApplicantListPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const [clan, setClan] = useState<any>(null);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    const fetchUserNames = useCallback(async (idsToFetch: string[]) => {
        // Prevent 401 error by ensuring token exists
        if (!token) return;

        const validIds = Array.from(new Set(idsToFetch)).filter(Boolean);
        if (validIds.length === 0) return;

        try {
            const res = await fetch(`/api/auth-proxy/users/lookup`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ userIds: validIds })
            });
            
            if (res.ok) {
                const data = await res.json();
                const newNames: Record<string, string> = {};
                
                if (data && Array.isArray(data.profiles)) {
                    data.profiles.forEach((user: any) => {
                        // Use user.id as requested by your backend friend
                        const matchId = user.id; 
                        newNames[matchId] = user.displayName || user.username || user.name || matchId;
                    });
                }
                
                setUserNames(prev => ({ ...prev, ...newNames }));
            } else {
                console.error("❌ Lookup API failed with status:", res.status);
            }
        } catch (err) {
            console.error("❌ Failed to lookup users", err);
        }
    }, [token]);

    const refresh = useCallback(async () => {
        const res = await fetch(`http://localhost:8080/api/clan/detail/${id}`);
        if (res.ok) {
            const data = await res.json();
            setClan(data);

            if (data && data.applicantIds && token) {
                fetchUserNames(data.applicantIds);
            }
        }
    }, [id, token, fetchUserNames]);

    useEffect(() => { 
        refresh(); 
    }, [refresh]);

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
                            <span className="font-medium text-lg">{userNames[applicantId] || applicantId}</span>
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