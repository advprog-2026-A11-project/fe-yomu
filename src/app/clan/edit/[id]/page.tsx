"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { fetchLiga } from '@/lib/fetch-liga';

export default function EditClanPage() {
    const { id } = useParams();
    const router = useRouter();
    const [name, setName] = useState("");
    const { token } = useAuth();

    useEffect(() => {
        fetchLiga(`/api/clan/detail/${id}`, token)
            .then(res => res.json())
            .then(data => setName(data.clanName));
    }, [id]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetchLiga('/api/clan/edit', token, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ clanId: id, clanName: name })
        });
        router.push(`/clan/detail/${id}`);
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-bold">Edit Clan Name</h2>
            <form onSubmit={handleUpdate} className="mt-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 w-64 mr-2" />
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Update</button>
            </form>
        </div>
    );
}