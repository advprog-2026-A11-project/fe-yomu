"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';

export default function ClanListPage() {
    const [clans, setClans] = useState<any[]>([]);

    const { session, token } = useAuth();
    const userRole = session?.profile?.role;

    let authUserId: string | null = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            authUserId = payload.sub;
        } catch (e) {
            console.error("Error decoding token:", e);
        }
    }

    useEffect(() => {
        fetch('http://localhost:8080/api/clan/list')
            .then(async (res) => {
                const text = await res.text();
                if (!text) return [];
                return JSON.parse(text);
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setClans(data);
                } else if (data && Array.isArray(data.data)) {
                    setClans(data.data);
                } else {
                    console.error("API did not return an array! It returned:", data);
                    setClans([]); 
                }
            })
            .catch(err => {
                console.error("Failed to fetch clans:", err);
                setClans([]); 
            });
    }, []);

    // --- Role Checks ---
    const isUserInAnyClan = clans.some(clan => 
        clan.leaderId === authUserId || 
        clan.members?.some((m: any) => m.userId === authUserId)
    );
    const isUserApplying = clans.some(clan => clan.applicantIds?.includes(authUserId));
    const isStudent = userRole === 'STUDENT';
    const canCreateClan = isStudent && authUserId && !isUserInAnyClan && !isUserApplying;

    return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Clan Leaderboard</h1>
                {canCreateClan && (
                    <Link href="/clan/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
                        Create New Clan
                    </Link>
                )}
            </div>

            <div className="grid gap-4">
                {clans.map((clan, index) => (
                    <div key={clan.clanId} className="border p-4 rounded-lg flex justify-between items-center bg-white shadow-sm hover:shadow-md transition">
                        <div>
                            <h2 className="text-xl font-semibold">#{index + 1} {clan.clanName}</h2>
                            <p className="text-gray-600">Rank: {clan.rankTier} | Score: {clan.clanScore}</p>
                            <p className="text-sm text-gray-500">Members: {clan.members?.length || 0}</p>
                        </div>
                        <Link href={`/clan/detail/${clan.clanId}`} className="text-blue-500 font-semibold hover:underline">
                            View Details
                        </Link>
                    </div>
                ))}
                {clans.length === 0 && (
                    <p className="text-gray-500">No clans found or loading...</p>
                )}
            </div>
        </div>
    );
}