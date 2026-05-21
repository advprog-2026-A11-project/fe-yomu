"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { extractErrorMessage } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";

// Define Types
type AchievementDetail = {
  id: number;
  title: string;
  description: string;
  milestone: number;
  milestoneType: string;
  iconUrl?: string | null;
};

type UserAchievement = {
  id: number;
  userId?: string;
  unlockedAt: string;
  showcased?: boolean;
  isShowcased?: boolean;
  achievement?: AchievementDetail;
  achievementId?: number;
  title?: string;
  description?: string;
  milestone?: number;
  milestoneType?: string;
  iconUrl?: string | null;
};

type DailyMission = {
  id: number;
  title: string;
  description: string;
  targetMilestone: number;
  rewardPoints: number;
  missionType: string;
  active?: boolean;
  activeDate?: string;
};

type UserDailyMission = {
  id: number;
  userId: string;
  dailyMission: DailyMission;
  currentProgress: number;
  completed: boolean;
};

// Global Helper Functions (Defined outside to reduce Cognitive Complexity)
function getMissionIcon(type: string): string {
  switch (type) {
    case "READ_NEWS":
      return "📰";
    case "QUIZ_ACCURACY":
      return "🎯";
    case "READ_FICTION":
      return "📚";
    case "QUIZ_COUNT":
      return "⚡";
    default:
      return "🏆";
  }
}

function getRankName(pts: number): string {
  if (pts >= 100) return "Master Literasi 🌟";
  if (pts >= 50) return "Ksatria Buku 📚";
  if (pts >= 20) return "Pembaca Aktif ⚡";
  return "Pemula Yomu 🌱";
}

function getShowcaseButtonText(itemId: number, showcased: boolean, togglingId: number | null): string {
  if (togglingId === itemId) {
    return "...";
  }
  return showcased ? "★ Dipajang" : "☆ Pajang";
}

function normalizeAchievement(item: UserAchievement) {
  const isShowcased = item.showcased ?? item.isShowcased ?? false;
  if (item.achievement) {
    return {
      id: item.id,
      achievementId: item.achievement.id,
      title: item.achievement.title,
      description: item.achievement.description,
      milestone: item.achievement.milestone,
      milestoneType: item.achievement.milestoneType,
      iconUrl: item.achievement.iconUrl,
      unlockedAt: item.unlockedAt,
      showcased: isShowcased,
    };
  }
  return {
    id: item.id,
    achievementId: item.achievementId || item.id,
    title: item.title || "Unlocked Title",
    description: item.description || "Description",
    milestone: item.milestone || 0,
    milestoneType: item.milestoneType || "UNKNOWN",
    iconUrl: item.iconUrl,
    unlockedAt: item.unlockedAt,
    showcased: isShowcased,
  };
}

export default function AchievementPage() {
  const { session, isAuthenticated } = useAuth();
  const userId = session?.profile?.id;

  // Tabs: "missions" | "gallery"
  const [activeTab, setActiveTab] = useState<"missions" | "gallery">("missions");

  // State Data
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [missions, setMissions] = useState<UserDailyMission[]>([]);
  const [score, setScore] = useState<number>(0);

  // Status & Messaging States
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [loadingMissions, setLoadingMissions] = useState(false);
  const [loadingScore, setLoadingScore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Fetch Score
  async function fetchScore() {
    if (!userId) return;
    setLoadingScore(true);
    try {
      const response = await fetch(`/api/achievement/student-progress/${userId}/score`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setScore(data.data.score || 0);
      }
    } catch (err) {
      console.error("Failed to fetch score:", err);
    } finally {
      setLoadingScore(false);
    }
  }

  // Fetch Achievements
  async function fetchAchievements() {
    setLoadingAchievements(true);
    setErrorMsg(null);
    try {
      // First try fetching /me, which is user-session bound
      const response = await fetch("/api/achievement/achievements/me", {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAchievements(data.data || []);
      } else if (userId) {
        // Fallback to fetch via userId path if /me failed or is unauthorized
        const fbResponse = await fetch(`/api/achievement/users/${userId}/achievements`, {
          cache: "no-store",
        });
        const fbData = await fbResponse.json();
        if (fbResponse.ok && fbData.success) {
          setAchievements(fbData.data || []);
        } else {
          throw new Error(fbData.message || "Failed to load achievements");
        }
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Failed to load achievements. Please try again."));
    } finally {
      setLoadingAchievements(false);
    }
  }

  // Fetch Daily Missions
  async function fetchMissions() {
    if (!userId) return;
    setLoadingMissions(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/achievement/student-progress/${userId}/missions`, {
        cache: "no-store",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMissions(data.data || []);
      } else {
        throw new Error(data.message || "Failed to load daily missions");
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Failed to load daily missions."));
    } finally {
      setLoadingMissions(false);
    }
  }

  // Initial Data Fetching
  useEffect(() => {
    if (isAuthenticated && userId) {
      void fetchScore();
      void fetchAchievements();
      void fetchMissions();
    }
  }, [isAuthenticated, userId]);

  // Normalize Achievement Properties
  const normalizedAchievements = achievements.map(normalizeAchievement);
  const featuredAchievements = normalizedAchievements.filter((a) => a.showcased);

  // Toggle Showcase status
  async function handleToggleShowcase(achievementId: number, currentStatus: boolean) {
    if (togglingId !== null) return;
    setTogglingId(achievementId);
    setErrorMsg(null);
    setSuccessMsg(null);

    const nextStatus = !currentStatus;

    // Enforce maximum 3 showcased achievements
    if (nextStatus && featuredAchievements.length >= 3) {
      setErrorMsg("Kamu hanya dapat menampilkan maksimal 3 piala di showcase!");
      setTogglingId(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/achievement/achievements/featured/${achievementId}?showcased=${nextStatus}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg(
          nextStatus
            ? "Piala berhasil dipajang di Showcase!"
            : "Piala berhasil diturunkan dari Showcase."
        );
        await fetchAchievements();
      } else {
        throw new Error(data.message || "Failed to update showcase status");
      }
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, "Gagal merubah status showcase piala."));
    } finally {
      setTogglingId(null);
    }
  }

  // Sub-renderers to eliminate nested ternaries and reduce complexity
  function renderMissionsTab() {
    if (loadingMissions) {
      return <LoadingState message="Memuat Misi Harian Anda..." />;
    }

    if (missions.length === 0) {
      return (
        <EmptyState
          icon="😴"
          title="Tidak Ada Misi Hari Ini"
          description="Belum ada misi harian yang diaktifkan untuk hari ini. Silahkan cek lagi nanti!"
        />
      );
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
        {missions.map((userMission) => {
          const progressPercent = Math.min(
            100,
            Math.round((userMission.currentProgress / userMission.dailyMission.targetMilestone) * 100)
          );

          return (
            <Card
              key={userMission.id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1.5rem",
                border: userMission.completed ? "1.5px solid var(--success)" : "1px solid var(--border)",
                background: userMission.completed ? "rgba(21, 128, 61, 0.02)" : "var(--surface)",
                transition: "transform 0.2s, box-shadow 0.2s",
                flexWrap: "wrap",
                gap: "1.5rem"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1.2rem", flex: 1, minWidth: "260px" }}>
                <div style={{
                  fontSize: "2.2rem",
                  background: userMission.completed ? "rgba(21, 128, 61, 0.1)" : "var(--background)",
                  borderRadius: "var(--radius-md)",
                  width: "3.8rem",
                  height: "3.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {getMissionIcon(userMission.dailyMission.missionType)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
                      {userMission.dailyMission.title}
                    </h3>
                    <Badge variant="warning" size="sm">+{userMission.dailyMission.rewardPoints} Pts</Badge>
                  </div>
                  <p style={{ margin: "0.25rem 0 0.75rem", color: "var(--text-soft)", fontSize: "0.9rem" }}>
                    {userMission.dailyMission.description}
                  </p>

                  <div style={{ width: "100%", maxWidth: "450px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.3rem", color: "var(--text-soft)" }}>
                      <span>Progres Misi</span>
                      <span>{userMission.currentProgress} / {userMission.dailyMission.targetMilestone}</span>
                    </div>
                    <Progress value={progressPercent} color={userMission.completed ? "success" : "brand"} />
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                {userMission.completed ? (
                  <Badge variant="success" size="lg">✓ Selesai</Badge>
                ) : (
                  <Badge variant="info" size="lg">Aktif</Badge>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  function renderGalleryTab() {
    if (loadingAchievements) {
      return <LoadingState message="Memuat Galeri Piala..." />;
    }

    if (normalizedAchievements.length === 0) {
      return (
        <EmptyState
          icon="📭"
          title="Belum Ada Piala Terkunci"
          description="Lanjutkan membaca buku dan menyelesaikan kuis untuk membuka piala-piala pertamamu!"
        />
      );
    }

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "1.5rem"
      }}>
        {normalizedAchievements.map((item) => (
          <Card
            key={item.id}
            style={{
              padding: "1.5rem",
              border: item.showcased ? "2px solid #fbbf24" : "1px solid var(--border)",
              background: "var(--surface)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "all 0.2s"
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <span style={{
                  fontSize: "2.4rem",
                  background: "var(--background)",
                  width: "3.8rem",
                  height: "3.8rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "var(--radius-md)"
                }}>
                  🏆
                </span>
                <Badge variant="info" size="sm">{item.milestoneType}</Badge>
              </div>

              <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "1.15rem", fontWeight: 800, color: "var(--text)" }}>
                {item.title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-soft)", lineHeight: 1.5 }}>
                {item.description}
              </p>
              <small style={{ display: "block", marginTop: "0.5rem", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700 }}>
                Milestone: {item.milestone}
              </small>
            </div>

            {/* Showcase action button */}
            <div style={{
              marginTop: "1.2rem",
              paddingTop: "0.8rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-soft)", fontWeight: 600 }}>
                Showcase status
              </span>
              
              <Button
                type="button"
                variant={item.showcased ? "gold" : "secondary"}
                size="sm"
                pill
                onClick={() => void handleToggleShowcase(item.achievementId, item.showcased)}
                disabled={togglingId !== null}
              >
                {getShowcaseButtonText(item.achievementId, item.showcased, togglingId)}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <ProtectedRoute description="Masuk ke akun Anda untuk melihat koleksi piala & misi harian Anda.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
        
        {/* Navigation & Header */}
        <div style={{ marginBottom: "2rem" }}>
          <p className="yomu-eyebrow">PENCAPAIAN</p>
          <h1 style={{ margin: "0.25rem 0 0", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Hall of Fame Yomu
          </h1>
        </div>

        {/* Global Alert Notification */}
        {errorMsg && (
          <div style={{
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid var(--error)",
            color: "var(--error)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontWeight: 600,
            fontSize: "0.95rem"
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: "rgba(21, 128, 61, 0.1)",
            border: "1px solid var(--success)",
            color: "var(--success)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            marginBottom: "1.5rem",
            fontWeight: 600,
            fontSize: "0.95rem"
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* PROFILE SCORECARD & SHOWCASE HERO */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          {/* Main User Card with score */}
          <Card style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            color: "white",
            border: "none",
            padding: "2rem",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
            boxShadow: "0 20px 40px rgba(49, 46, 129, 0.25)"
          }}>
            <div>
              <span style={{ textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.15em", color: "#a5b4fc", fontWeight: 800 }}>
                Skor Literasi Kamu
              </span>
              <h2 style={{ fontSize: "3rem", fontWeight: 900, margin: "0.5rem 0", color: "#fbbf24" }}>
                {loadingScore ? "..." : `${score} Pts`}
              </h2>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255, 255, 255, 0.1)", padding: "0.4rem 0.8rem", borderRadius: "999px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  Rank: {getRankName(score)}
                </span>
              </div>
            </div>

            <div style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.5rem",
              textAlign: "right"
            }}>
              <div style={{ color: "#c7d2fe", fontSize: "0.85rem", fontWeight: 700 }}>MISI HARI INI</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem" }}>
                {loadingMissions ? "..." : `${missions.filter(m => m.completed).length} / ${missions.length}`}
              </div>
              <div style={{ color: "#a5b4fc", fontSize: "0.8rem", marginTop: "0.2rem" }}>Selesai</div>
            </div>
          </Card>

          {/* Showcased Slots */}
          <Card style={{
            background: "var(--surface)",
            padding: "1.5rem",
            boxShadow: "var(--shadow-soft)",
            border: "1px solid var(--border)"
          }}>
            <p className="eyebrow" style={{ margin: "0 0 1rem 0" }}>🏆 Lemari Pajangan Piala (Maksimal 3)</p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1rem",
              minHeight: "130px"
            }}>
              {[0, 1, 2].map((index) => {
                const item = featuredAchievements[index];
                if (item) {
                  return (
                    <div key={item.id} style={{
                      background: "linear-gradient(to bottom, #fffbeb, #fef3c7)",
                      border: "1.5px solid #f59e0b",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      position: "relative",
                      transition: "transform 0.2s",
                      boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)"
                    }}>
                      <button
                        title="Turunkan dari showcase"
                        onClick={() => void handleToggleShowcase(item.achievementId, true)}
                        disabled={togglingId !== null}
                        style={{
                          position: "absolute",
                          top: "0.3rem",
                          right: "0.3rem",
                          background: "var(--error)",
                          color: "white",
                          border: "none",
                          borderRadius: "999px",
                          width: "1.3rem",
                          height: "1.3rem",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold"
                        }}
                      >
                        ×
                      </button>
                      <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>⭐</div>
                      <strong style={{ fontSize: "0.85rem", color: "#78350f", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: "0.7rem", color: "#b45309" }}>{item.milestoneType}</span>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} style={{
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius-md)",
                      background: "rgba(0,0,0,0.01)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      color: "var(--text-soft)",
                      fontSize: "0.8rem",
                      textAlign: "center",
                      padding: "1rem"
                    }}>
                      <div style={{ fontSize: "1.5rem", opacity: 0.3, marginBottom: "0.25rem" }}>🔒</div>
                      <span>Kosong</span>
                    </div>
                  );
                }
              })}
            </div>
          </Card>
        </div>

        {/* INTERACTIVE NAVIGATION TABS */}
        <Tabs
          items={[
            { id: "missions", label: "🎯 Misi Harian" },
            { id: "gallery", label: `🏆 Galeri Piala (${achievements.length})` },
          ]}
          active={activeTab}
          onChange={(id) => setActiveTab(id as "missions" | "gallery")}
        />

        {/* TAB CONTENTS */}
        <div style={{ marginTop: "1.5rem" }}>
          {activeTab === "missions" ? renderMissionsTab() : renderGalleryTab()}
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
