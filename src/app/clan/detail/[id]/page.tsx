"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ClanDetailPage() {
    const { id } = useParams();
    const [clan, setClan] = useState<any>(null);

    useEffect(() => {
        fetch(`http://localhost:8080/api/clan/detail/${id}`)
            .then(res => res.json())
            .then(data => setClan(data));
    }, [id]);

    if (!clan) return <div>Loading...</div>;

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold">Clan: {clan.clanName}</h2>
            <p>Total Score: <strong>{clan.clanScore}</strong></p>

            <table className="w-full mt-4 border">
                <thead>
                <tr>
                    <th className="border p-2">Member</th>
                    <th className="border p-2">Score</th>
                </tr>
                </thead>
                <tbody>
                {clan.memberScores.map((score: number, index: number) => (
                    <tr key={index}>
                        <td className="border p-2">Member {index + 1}</td>
                        <td className="border p-2">{score}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}