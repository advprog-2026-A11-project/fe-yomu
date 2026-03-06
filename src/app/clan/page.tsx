"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ClanListPage() {
    const [clans, setClans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchClans = () => {
        setIsLoading(true);
        fetch('http://localhost:8080/api/clan/list')
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                setClans(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Fetch error:", err);
                setClans([]);
                setIsLoading(false);
            });
    };

    useEffect(() => {
        fetchClans();
    }, []);

    const deleteClan = async (id: string) => {
        if (confirm("Are you sure you want to delete this clan?")) {
            await fetch(`http://localhost:8080/api/clan/delete/${id}`, { method: 'DELETE' });
            fetchClans(); // Refresh the list
        }
    };

    const getTierColor = (tier: string) => {
        switch (tier) {
            case 'Diamond': return 'text-cyan-500 font-bold';
            case 'Platinum': return 'text-teal-400 font-bold';
            case 'Gold': return 'text-yellow-500 font-bold';
            case 'Silver': return 'text-gray-400 font-bold';
            case 'Bronze': return 'text-orange-600 font-bold';
            default: return 'text-gray-700';
        }
    };

    if (isLoading) {
        return <div className="p-4">Loading Clan Data...</div>;
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold">Clan List</h2>
            <Link href="/clan/create" className="text-blue-500 underline inline-block my-2">
                + Create New Clan
            </Link>

            {clans.length === 0 ? (
                <p className="mt-4 text-gray-500">No clans found. Try creating one!</p>
            ) : (
                <table className="w-full mt-4 border">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Clan Name</th>
                        <th className="border p-2 text-left">Total Score</th>
                        <th className="border p-2 text-left">Rank Tier</th>
                        <th className="border p-2 text-left">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {clans.map(clan => (
                        <tr key={clan.clanId}>
                            <td className="border p-2">{clan.clanName}</td>
                            <td className="border p-2">{clan.clanScore}</td>
                            <td className={`border p-2 ${getTierColor(clan.rankTier)}`}>{clan.rankTier}</td>
                            <td className="border p-2 space-x-2">
                                <Link href={`/clan/detail/${clan.clanId}`} className="text-green-600">View</Link>
                                <Link href={`/clan/edit/${clan.clanId}`} className="text-blue-600">Edit</Link>
                                <button onClick={() => deleteClan(clan.clanId)} className="text-red-500">Delete</button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}