'use client';

import { useEffect, useState } from 'react';

interface Achievement {
    id: string;
    title: string;
    description: string;
    milestone: string;
}

export default function AchievementPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:8080/api/achievement')
            .then((res) => res.json())
            .then((data) => {
                setAchievements(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fail load data:", err);
                setLoading(false);
            });
    }, []);

    return (
        <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h2 style={{ fontSize: "1.25rem" }}>My Achievements</h2>
            </div>

            {loading && <p>Loading achievements...</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.length > 0 ? (
                    achievements.map((ach) => (
                        <div key={ach.id} className="card" style={{ marginBottom: "1rem" }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
                            <h3 style={{ fontWeight: 700, color: "var(--primary)" }}>{ach.title}</h3>
                            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>{ach.description}</p>
                            <div style={{
                                marginTop: "1rem",
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                background: "var(--secondary)",
                                fontSize: "0.8rem"
                            }}>
                                Milestone: {ach.milestone}
                            </div>
                        </div>
                    ))
                ) : (
                    !loading && <p className="text-gray-400 italic">No achievements found yet.</p>
                )}
            </div>
        </section>
    );
}