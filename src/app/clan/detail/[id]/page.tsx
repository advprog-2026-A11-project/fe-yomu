"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ClanDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [clan, setClan] = useState<any>(null);

    const refresh = () => {
        fetch(`http://localhost:8080/api/clan/detail/${id}`)
            .then(res => res.json())
            .then(data => setClan(data));
    };

    useEffect(() => { refresh(); }, [id]);

    const deleteClan = async () => {
        if (confirm("Are you sure you want to delete this clan?")) {
            await fetch(`http://localhost:8080/api/clan/delete/${id}`, { method: 'DELETE' });
            router.push('/clan');
        }
    };

    const deleteMember = async (index: number) => {
        if (confirm("Remove this member's score?")) {
            await fetch(`http://localhost:8080/api/clan/${id}/delete-member/${index}`, { method: 'DELETE' });
            refresh();
        }
    };

    if (!clan) return <div className="p-8 text-center">Loading Clan Details...</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Clan: {clan.clanName}</h1>
            <p className="text-gray-600 mb-6 text-lg">Total Clan Score: <span className="font-bold text-black">{clan.clanScore}</span></p>

            <div className="my-6 flex flex-wrap gap-4">
                <Link href={`/clan/detail/${id}/add-member`} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition">
                    + Add Member
                </Link>
                <Link href={`/clan/edit/${id}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition">
                    Edit Clan Name
                </Link>
                <button onClick={deleteClan} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition">
                    Delete Clan
                </button>
                {/* Back Button added here */}
                <Link href="/clan" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition">
                    Back to List
                </Link>
            </div>

            <div className="overflow-hidden border rounded-lg">
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-4 font-semibold">Member</th>
                        <th className="p-4 font-semibold">Score</th>
                        <th className="p-4 font-semibold">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clan.memberScores.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="p-8 text-center text-gray-400">No members in this clan yet.</td>
                        </tr>
                    ) : (
                        clan.memberScores.map((score: number, index: number) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-700 font-medium">Member {index + 1}</td>
                                <td className="p-4 font-mono">{score}</td>
                                <td className="p-4 space-x-3">
                                    <Link
                                        href={`/clan/detail/${id}/edit-member/${index}?score=${score}`}
                                        className="text-blue-500 hover:text-blue-700 font-semibold"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => deleteMember(index)}
                                        className="text-red-500 hover:text-red-700 font-semibold"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}