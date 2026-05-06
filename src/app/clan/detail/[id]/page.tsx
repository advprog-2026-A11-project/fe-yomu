"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useAuth } from '@/components/providers/auth-provider';

export default function ClanDetailPage() {
    const { session, token } = useAuth();
    
    let authUserId: string | null = null;
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            authUserId = payload.sub;
        } catch (e) {
            console.error("Error decoding token:", e);
        }
    }

    const { id } = useParams();
    const router = useRouter();
    const [clan, setClan] = useState<any>(null);
    const [allClans, setAllClans] = useState<any[]>([]);

    const refresh = async () => {
        const clanRes = await fetch(`http://localhost:8080/api/clan/detail/${id}`);
        const clanData = await clanRes.json();
        setClan(clanData);

        const allRes = await fetch(`http://localhost:8080/api/clan/list`);
        const allData = await allRes.json();
        setAllClans(allData);
    };

    useEffect(() => {
        refresh();
    }, [id]);

    if (!clan) return <div className="p-8 text-center">Loading Clan Details...</div>;

    // --- Role Checks ---
    const isLeader = clan.leaderId === authUserId;
    const isMember = clan.members?.some((m: any) => m.userId === authUserId);
    const isApplyingToThisClan = clan.applicantIds?.includes(authUserId);

    const isUserInAnyClan = allClans.some(c => c.members?.some((m: any) => m.userId === authUserId));
    const isUserApplyingAnywhere = allClans.some(c => c.applicantIds?.includes(authUserId));
    const canApply = authUserId && !isUserInAnyClan && !isUserApplyingAnywhere;

    // --- Actions ---
    const handleAction = async (endpoint: string, method: string) => {
        await fetch(`http://localhost:8080/api/clan/${id}${endpoint}`, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        refresh();
    };

    const deleteClan = async () => {
        if (confirm("Are you sure you want to delete this clan?")) {
            // FIX: Match the backend URL exactly: /api/clan/delete/{id}
            await fetch(`http://localhost:8080/api/clan/delete/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            router.push('/clan');
        }
    };

    const handleKick = async (memberId: string) => {
        if (confirm("Are you sure you want to kick this member?")) {
            await fetch(`http://localhost:8080/api/clan/${id}/kick/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            refresh();
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Clan: {clan.clanName}</h1>
            <p className="text-gray-600 mb-6 text-lg">Total Score: <span className="font-bold text-black">{clan.clanScore}</span></p>

            {/* Action Buttons based on Role */}
            <div className="my-6 flex flex-wrap gap-4">
                {canApply && (
                    <button onClick={() => handleAction('/apply', 'POST')} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Apply to Join</button>
                )}

                {isApplyingToThisClan && (
                    <button onClick={() => handleAction('/cancel-application', 'DELETE')} className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Cancel Application</button>
                )}

                {isMember && !isLeader && (
                    <button onClick={() => handleAction('/quit', 'DELETE')} className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">Quit Clan</button>
                )}

                {isLeader && (
                    <>
                        <Link href={`/clan/detail/${id}/applicants`} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                            Manage Applicants ({clan.applicantIds?.length || 0})
                        </Link>
                        {/* FIX: Added the Edit Clan Button */}
                        <Link href={`/clan/edit/${id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Edit Clan
                        </Link>
                        <button onClick={deleteClan} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Clan</button>
                    </>
                )}
                <Link href="/clan" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back to List</Link>
            </div>

            {/* Member List */}
            <div className="overflow-hidden border rounded-lg mt-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-4 font-semibold">User ID</th>
                        <th className="p-4 font-semibold">Score</th>
                        <th className="p-4 font-semibold">Role</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clan.members?.map((member: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-4">{member.userId}</td>
                            <td className="p-4 font-mono">{member.score}</td>
                            <td className="p-4 flex items-center justify-between">
                                <span>{member.userId === clan.leaderId ? "Leader" : "Member"}</span>

                                {isLeader && member.userId !== clan.leaderId && (
                                    <button
                                        onClick={() => handleKick(member.userId)}
                                        className="text-red-500 hover:text-white hover:bg-red-500 text-sm border border-red-500 px-3 py-1 rounded transition"
                                    >
                                        Kick
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}