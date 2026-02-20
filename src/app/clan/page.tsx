"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClanListPage() {
    const [clans, setClans] = useState<any[]>([]);

    useEffect(() => {
        fetch('http://localhost:8080/api/clan/list')
            .then(res => res.json())
            .then(data => setClans(data));
    }, []);

    const deleteClan = async (id: string) => {
        await fetch(`http://localhost:8080/api/clan/delete/${id}`, { method: 'DELETE' });
        setClans(clans.filter(c => c.clanId !== id));
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Clan List</h2>
            <Link href="/clan/create" className="text-blue-500 underline">Create New Clan</Link>
            <table className="w-full mt-4 border">
                <thead>
                <tr className="bg-gray-100">
                    <th className="border p-2">Clan Name</th>
                    <th className="border p-2">Total Score</th>
                    <th className="border p-2">Actions</th>
                </tr>
                </thead>
                <tbody>
                {clans.map(clan => (
                    <tr key={clan.clanId}>
                        <td className="border p-2">{clan.clanName}</td>
                        <td className="border p-2">{clan.clanScore}</td>
                        <td className="border p-2">
                            <Link href={`/clan/detail/${clan.clanId}`} className="mr-2">View</Link>
                            <button onClick={() => deleteClan(clan.clanId)} className="text-red-500">Delete</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}