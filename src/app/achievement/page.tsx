import Link from "next/link";

export default function AchievementPage() {
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Link href="/" className="btn" style={{ background : "gold", color : "black"}}>
                    Back to Home
                </Link>
            </div>

            <div style={{ textAlign: "center", marginTop: "3rem" }}>
                <h1>🏆 Achievement Gallery</h1>
                <p>Welcome to your collection of honors!</p>
            </div>

            <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
                <div className="card">
                    <h3>First Steps</h3>
                    <p>Complete your first reading material.</p>
                    <small>Milestone: 1</small>
                </div>
            </div>
        </div>
    );
}