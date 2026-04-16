"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase directly using your friend's environment variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ClanListPage() {
    const [clans, setClans] = useState<any[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        // 1. Get the logged-in user from Supabase
        const fetchAuth = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setUserId(data.session.user.id);
            }
        };
        fetchAuth();

        // 2. Fetch the clans
        fetch('http://localhost:8080/api/clan/list')
            .then(res => res.json())
            .then(data => setClans(data));
    }, []);

    // Compute user status based on all clans
    const isUserInAnyClan = clans.some(clan => clan.members?.some((m: any) => m.userId === userId));
    const isUserApplying = clans.some(clan => clan.applicantIds?.includes(userId));
    const canCreateClan = userId && !isUserInAnyClan && !isUserApplying;

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
            </div>
        </div>
    );
}