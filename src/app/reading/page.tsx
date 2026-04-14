"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080/api/admin/readings";

export default function BacaanPage() {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReadings();
    }, []);

    const fetchReadings = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/reading-list`);

            if (!response.ok) throw new Error("Failed to fetch data");

            const data = await response.json();
            setReadings(data);
        } catch (error) {
            console.error("Error fetching data: ", error);
        } finally {
            setLoading(false)
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this material?")) {
            try {
                const response = await fetch(`${API_BASE_URL}/${id}`, {
                    method: "DELETE"
                });

                if (response.ok) {
                    alert("Deleted successfully!");
                    fetchReadings();    // refresh data
                } else {
                    alert("Failed to delete material")
                }
            } catch (error) {
                console.error("Delete error: ", error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Dashboard</h1>
                        <p className="text-gray-500 mt-1">Manage reading materials and exercises</p>
                    </div>
                    {/* Link disesuaikan ke folder yang benar */}
                    <Link
                        href="/reading/create-bacaan"
                        className="bg-blue-400 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-200 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create Exercise
                    </Link>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Difficulty</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading materials...</td>
                                </tr>
                            ) : readings.length > 0 ? (
                                readings.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{item.title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.category}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4">
                                                <span className={`text-sm ${
                                                    item.difficultyLevel === 'ADVANCED' ? 'text-red-600' :
                                                        item.difficultyLevel === 'INTERMEDIATE' ? 'text-orange-600' : 'text-green-600'
                                                } font-medium`}>
                                                    {item.difficultyLevel}
                                                </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Link
                                                    href={`/reading/create-bacaan?id=${item.id}`}
                                                    className="!text-green-600 hover:!text-green-800 text-sm font-bold transition-colors">
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm font-bold"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="text-gray-400 mb-2 font-medium">No materials found.</div>
                                        <p className="text-sm text-gray-500">Start by creating your first reading exercise.</p>
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}