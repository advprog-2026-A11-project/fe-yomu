"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchLiga } from '@/lib/fetch-liga';

export default function ClanDetailPage() {
    const { session, token } = useAuth();
    
    // FIX 1: We just use the session ID directly! This IS the yomu_user_id.
    const authUserId = session?.profile?.id || null;

    const { id } = useParams();
    const router = useRouter();
    const [clan, setClan] = useState<any>(null);
    const [allClans, setAllClans] = useState<any[]>([]);
    const [userNames, setUserNames] = useState<Record<string, string>>({});

    // FIX 2: Wrap in useCallback so it works cleanly inside useEffect
    const fetchUserNames = useCallback(async (idsToFetch: string[]) => {
        // FIX 3: Stop the function if the token isn't loaded yet! (Prevents the 401 error)
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
                        // FIX 4: Just use user.id directly! No need to check supabaseUserId.
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
        const clanRes = await fetchLiga(`/api/clan/detail/${id}`, token);
        if (clanRes.ok) {
            const clanData = await clanRes.json();
            setClan(clanData);

            // Fetch names only if the token is available
            if (token) {
                const memberIds = clanData.members?.map((m: any) => m.userId) || [];
                fetchUserNames([clanData.leaderId, ...memberIds]);
            }
        }

        const allRes = await fetchLiga('/api/clan/list', token);
        if (allRes.ok) {
            const allData = await allRes.json();
            setAllClans(allData);
        }
    }, [id, token, fetchUserNames]);

    // FIX 5: Ensure useEffect runs when `token` changes so it fetches when ready
    useEffect(() => {
        refresh();
    }, [refresh]);

    if (!clan) return <div className="p-8 text-center">Loading Clan Details...</div>;

    const isLeader = clan.leaderId === authUserId;
    const isMember = clan.members?.some((m: any) => m.userId === authUserId);
    const isApplyingToThisClan = clan.applicantIds?.includes(authUserId);

    const isUserInAnyClan = allClans.some(c => c.members?.some((m: any) => m.userId === authUserId));
    const isUserApplyingAnywhere = allClans.some(c => c.applicantIds?.includes(authUserId));
    const canApply = authUserId && !isUserInAnyClan && !isUserApplyingAnywhere;

    const handleAction = async (endpoint: string, method: string) => {
        await fetchLiga(`/api/clan/${id}${endpoint}`, token, {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        });
        refresh();
    };

    const deleteClan = async () => {
        if (confirm("Are you sure you want to delete this clan?")) {
            await fetchLiga(`/api/clan/delete/${id}`, token, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            router.push('/clan');
        }
    };

    const handleKick = async (memberId: string) => {
        if (confirm("Are you sure you want to kick this member?")) {
            await fetchLiga(`/api/clan/${id}/kick/${memberId}`, token, {
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
                        <Link href={`/clan/edit/${id}`} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Edit Clan
                        </Link>
                        <button onClick={deleteClan} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete Clan</button>
                    </>
                )}
                <Link href="/clan" className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back to List</Link>
            </div>

            <div className="overflow-hidden border rounded-lg mt-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-4 font-semibold">User</th>
                        <th className="p-4 font-semibold">Score</th>
                        <th className="p-4 font-semibold">Role</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clan.members?.map((member: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-medium">{userNames[member.userId] || member.userId}</td>
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