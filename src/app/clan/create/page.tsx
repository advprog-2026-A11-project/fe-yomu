"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CreateClanPage() {
    const [name, setName] = useState("");
    const [token, setToken] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchToken = async () => {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                setToken(data.session.access_token);
            }
        };
        fetchToken();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            alert("You must be logged in to create a clan!");
            return;
        }

        await fetch('http://localhost:8080/api/clan/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ clanName: name })
        });

        router.push('/clan');
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