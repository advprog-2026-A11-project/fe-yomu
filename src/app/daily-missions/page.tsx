"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import {
    DailyMission,
    UserDailyMission,
    getAllDailyMissions,
    getStudentMissions,
} from "@/lib/achievementApi";

// ---- Admin: lihat semua mission ----
function AdminMissionView({ token }: { token: string }) {
    const [missions, setMissions] = useState<DailyMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getAllDailyMissions(token)
            .then(setMissions)
            .catch(() => setError("Gagal memuat daily missions."))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>🛠️ Kelola Daily Mission (Admin)</h2>
            <div style={{ display: "grid", gap: "1rem" }}>
                {missions.map((m) => (
                    <div key={m.id} className="card" style={{ border: "1px solid #ddd", padding: "1rem" }}>
                        <h3>{m.title}</h3>
                        <p>{m.description}</p>
                        <small>Target: {m.targetMilestone} | Reward: {m.rewardPoints} pts</small>
                    </div>
                ))}
                {missions.length === 0 && <p>Belum ada daily mission.</p>}
            </div>
        </div>
    );
}

// ---- Student: lihat progress mission mereka ----
function StudentMissionView({ token, userId }: { token: string; userId: string }) {
    const [missions, setMissions] = useState<UserDailyMission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        getStudentMissions(userId, token)
            .then(setMissions)
            .catch(() => setError("Gagal memuat misi harian kamu."))
            .finally(() => setLoading(false));
    }, [userId, token]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    return (
        <div>
            <h2>📋 Misi Harian Kamu</h2>
            {missions.length === 0 ? (
                <p style={{ textAlign: "center", color: "gray" }}>
                    Belum ada misi untukmu hari ini. Cek lagi nanti! 🌟
                </p>
            ) : (
                <div style={{ display: "grid", gap: "1rem" }}>
                    {missions.map((um) => (
                        <div key={um.id} className="card" style={{
                            border: `1px solid ${um.completed ? "green" : "#ddd"}`,
                            padding: "1rem",
                            background: um.completed ? "#f0fff0" : "white"
                        }}>
                            <h3>Misi #{um.missionId} {um.completed ? "✅" : "⏳"}</h3>
                            <p>Progress: {um.progress}</p>
                            <small>{um.completed ? "Selesai!" : "Sedang berjalan"}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---- Halaman Utama ----
export default function DailyMissionPage() {
    const { token, session, isAdmin } = useAuth();
    const userId = session?.profile?.id;

    return (
        <ProtectedRoute description="Login untuk melihat misi harian kamu.">
            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <h1>📋 Daily Missions</h1>
                    <p>Selesaikan misi harian untuk mendapatkan reward points!</p>
                </div>

                {token && (
                    isAdmin
                        ? <AdminMissionView token={token} />
                        : userId
                            ? <StudentMissionView token={token} userId={userId} />
                            : <p>Memuat info user...</p>
                )}
            </div>
        </ProtectedRoute>
    );
}