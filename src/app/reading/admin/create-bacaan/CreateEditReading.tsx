"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";

const API_ADMIN = "http://localhost:8083/api/admin/readings";

export default function CreateEditReading() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get("id"); // Cek jika ada ID untuk mode Edit
    // const { token } = useAuth();

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        category: "",
        difficultyLevel: "BEGINNER",
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editId) {
            const fetchOldData = async () => {
                try {
                    setLoading(true);
                    const response = await fetch(`${API_ADMIN}/${editId}`);
                    if (response.ok) {
                        const data = await response.json();
                        // Isi semua field agar bisa diedit
                        setFormData({
                            title: data.title || "",
                            content: data.content || "",
                            category: data.category || "",
                            difficultyLevel: data.difficultyLevel || "BEGINNER",
                        });
                    }
                } catch (error) {
                    console.error("Fetch the old data:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchOldData();
        }
    }, [editId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Button push");

        // if (!token) {
        //     alert("No valid token");
        //     console.log("TOKEN:", token);
        //     return;
        // }

        const url = editId ? `${API_ADMIN}/${editId}` : `${API_ADMIN}/create`;
        const method = editId ? "PUT" : "POST";
        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    //Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error("Detail Error Server:", response.status, errorData);
                alert(`Failed to save: ${response.status} - ${errorData}`);
                return;
            }

            if (response.ok) {
                alert(editId ? "Material updated!" : "Material created!");
                router.push("/reading/admin");
                router.refresh();
            }
        } catch (error) {
            console.error("Error saving reading:", error);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-8 bg-white shadow-md rounded-xl mt-10">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">
                {editId ? "Edit Reading Material" : "Create New Reading Exercise"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        className="w-full p-2 border rounded-md"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <input
                            type="text"
                            className="w-full p-2 border rounded-md"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                        <select
                            className="w-full p-2 border rounded-md"
                            value={formData.difficultyLevel}
                            onChange={(e) => setFormData({...formData, difficultyLevel: e.target.value})}
                        >
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Content</label>
                    <textarea
                        className="w-full p-2 border rounded-md h-40"
                        value={formData.content}
                        onChange={(e) => setFormData({...formData, content: e.target.value})}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Link href="/reading/admin" className="px-4 py-2 text-gray-600 hover:underline">Cancel</Link>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        {editId ? "Update" : "Save Material"}
                    </button>
                </div>
            </form>
        </div>
    );
}