"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/providers/auth-provider';

export default function CreateClanPage() {
    const [name, setName] = useState("");
    const router = useRouter();

    const { token } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            alert("You must be logged in to create a clan!");
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/clan/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ clanName: name })
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                alert(`Backend rejected the request! Status: ${response.status}. Error: ${errorMessage}`);
                return; 
            }

            alert("Clan successfully created!");
            router.push('/clan');
            
        } catch (error) {
            alert(`Network or CORS error: ${error}`);
        }
    };

    return (
        <div className="p-8 max-w-xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-4">Create New Clan</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Enter Clan Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="border p-2 rounded w-full"
                    required
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                    Save Clan
                </button>
            </form>
        </div>
    );
}