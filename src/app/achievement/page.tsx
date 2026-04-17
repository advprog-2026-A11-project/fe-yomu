"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import {
    Achievement,
    UserAchievement,
    getAllAchievements,
    getMyAchievements,
    deleteAchievement,
} from "@/lib/achievementApi";

// ---- Tampilan untuk Admin ----
function AdminAchievementView({ token }: { token: string }) {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deleting, setDeleting] = useState<number | null>(null);

    useEffect(() => {
        getAllAchievements(token)
            .then(setAchievements)
            .catch(() => setError("Gagal memuat achievement. Pastikan kamu login sebagai Admin."))
            .finally(() => setLoading(false));
    }, [token]);

    async function handleDelete(id: number) {
        if (!confirm("Hapus achievement ini?")) return;
        setDeleting(id);
        try {
            await deleteAchievement(id, token);
            setAchievements((prev) => prev.filter((a) => a.id !== id));
        } catch {
            alert("Gagal menghapus achievement.");
        } finally {
            setDeleting(null);
        }
    }

    if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>🛠️ Kelola Achievement (Admin)</h2>
            <p>Total: {achievements.length} achievement</p>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                {achievements.map((a) => (
                    <div className="card" key={a.id} style={{ border: "1px solid #ddd", padding: "1rem" }}>
                        <h3>{a.title}</h3>
                        <p>{a.description}</p>
                        <small>Milestone: {a.milestone}</small>
                        <div style={{ marginTop: "0.5rem" }}>
                            <button
                                disabled={deleting === a.id}
                                onClick={() => handleDelete(a.id)}
                                style={{ background: "red", color: "white", border: "none", padding: "0.3rem 0.8rem", cursor: "pointer" }}
                            >
                                {deleting === a.id ? "Menghapus..." : "Hapus"}
                            </button>
                        </div>
                    </div>
                ))}
                {achievements.length === 0 && <p>Belum ada achievement. Tambahkan dulu!</p>}
            </div>
        </div>
    );
}

// ---- Tampilan untuk Student ----
function StudentAchievementView({ token }: { token: string }) {
    const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getMyAchievements(token)
            .then(setUserAchievements)
            .catch(() => setError("Gagal memuat achievement kamu."))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <p style={{ textAlign: "center" }}>Loading...</p>;
    if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>🏆 Achievement Kamu</h2>
            {userAchievements.length === 0 ? (
                <p style={{ textAlign: "center", color: "gray" }}>
                    Kamu belum unlock achievement apapun. Terus belajar! 💪
                </p>
            ) : (
                <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
                    {userAchievements.map((ua) => (
                        <div className="card" key={ua.id} style={{ border: "1px solid gold", padding: "1rem", background: "#fffdf0" }}>
                            <h3>🎖️ Achievement #{ua.achievementId}</h3>
                            <small>Unlocked: {new Date(ua.unlockedAt).toLocaleDateString("id-ID")}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---- Halaman Utama ----
export default function AchievementPage() {
    const { token, isAdmin } = useAuth();

    return (
        <ProtectedRoute description="Login untuk melihat achievement kamu.">
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1>🏆 Achievement Gallery</h1>
                    <p>
                        {isAdmin
                            ? "Kamu login sebagai Admin. Kamu bisa mengelola achievement di sini."
                            : "Selamat datang! Lihat pencapaian yang sudah kamu raih."}
                    </p>
                </div>

                {token ? (
                    isAdmin ? (
                        <AdminAchievementView token={token} />
                    ) : (
                        <StudentAchievementView token={token} />
                    )
                ) : (
                    <p>Memuat session...</p>
                )}
            </div>
        </ProtectedRoute>
    );
}