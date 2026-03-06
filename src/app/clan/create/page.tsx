"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateClanPage() {
    const [name, setName] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('http://localhost:8080/api/clan/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clanName: name })
        });
        router.push('/clan'); // Go back to list
    };

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Create New Clan</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter Clan Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 mr-2"
                />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
            </form>
        </div>
    );
}