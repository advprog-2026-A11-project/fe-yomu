"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/ui/LoadingState";
import { Progress } from "@/components/ui/Progress";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { API } from "@/constants/api";
import { extractErrorMessage } from "@/lib/auth-client";

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type Achievement = {
  id: number;
  title: string;
  description: string;
  milestone: number;
  milestoneType?: string | null;
  iconUrl?: string | null;
};

type UserAchievement = {
  id: number;
  userId?: string;
  unlockedAt?: string;
  showcased?: boolean;
  isShowcased?: boolean;
  achievement?: Achievement;
  achievementId?: number;
  title?: string;
  description?: string;
  milestone?: number;
  milestoneType?: string | null;
  iconUrl?: string | null;
};

type DailyMission = {
  id: number;
  title: string;
  description: string;
  targetMilestone: number;
  rewardPoints: number;
  missionType: string;
  activeDate?: string | null;
};

type UserDailyMission = {
  id: number;
  currentProgress: number;
  completed: boolean;
  rewardClaimed?: boolean;
  dailyMission: DailyMission;
};

type StudentScore = {
  score?: number;
  totalScore?: number;
};

type NormalizedAchievement = Achievement & {
  userAchievementId: number;
  achievementId: number;
  showcased: boolean;
  unlockedAt?: string;
};

type AchievementForm = {
  id?: number;
  title: string;
  description: string;
  milestone: string;
  milestoneType: string;
};

type MissionForm = {
  id?: number;
  title: string;
  description: string;
  targetMilestone: string;
  rewardPoints: string;
  missionType: string;
  activeDate: string;
};

type AchievementTab = "missions" | "achievements" | "public" | "admin-achievements" | "admin-missions";

const MILESTONE_TYPES = ["QUIZ_COUNT", "READ_NEWS", "READ_FICTION", "QUIZ_ACCURACY", "CLAN_DIAMOND"];
const SHOWCASE_LIMIT = 3;

const emptyAchievementForm: AchievementForm = {
  title: "",
  description: "",
  milestone: "1",
  milestoneType: "QUIZ_COUNT",
};

const emptyMissionForm: MissionForm = {
  title: "",
  description: "",
  targetMilestone: "1",
  rewardPoints: "10",
  missionType: "QUIZ_COUNT",
  activeDate: new Date().toISOString().slice(0, 10),
};

function normalizeAchievement(item: UserAchievement): NormalizedAchievement {
  const source = item.achievement;

  return {
    id: source?.id ?? item.achievementId ?? item.id,
    userAchievementId: item.id,
    achievementId: source?.id ?? item.achievementId ?? item.id,
    title: source?.title ?? item.title ?? "Achievement",
    description: source?.description ?? item.description ?? "-",
    milestone: source?.milestone ?? item.milestone ?? 0,
    milestoneType: source?.milestoneType ?? item.milestoneType ?? "UNKNOWN",
    iconUrl: source?.iconUrl ?? item.iconUrl,
    showcased: item.showcased ?? item.isShowcased ?? false,
    unlockedAt: item.unlockedAt,
  };
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
  const payload = await response.json().catch(() => ({} as ApiResponse<T>));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || "Request failed");
  }

  return (payload.data ?? payload) as T;
}

function toProgressPercent(current: number, target: number): number {
  if (target <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((current / target) * 100));
}

function getMilestoneLabel(type?: string | null): string {
  const labels: Record<string, string> = {
    QUIZ_COUNT: "Quiz count",
    READ_NEWS: "Read news",
    READ_FICTION: "Read fiction",
    QUIZ_ACCURACY: "Perfect accuracy",
    CLAN_DIAMOND: "Diamond clan",
  };

  return labels[type || ""] || type || "Custom";
}

function isAchievementTab(tab: string): tab is AchievementTab {
  return ["missions", "achievements", "public", "admin-achievements", "admin-missions"].includes(tab);
}

export default function AchievementPage() {
  const { session, isAuthenticated, isAdmin } = useAuth();
  const userId = session?.profile?.id;

  const [activeTab, setActiveTab] = useState<AchievementTab>("missions");
  const [score, setScore] = useState(0);
  const [achievements, setAchievements] = useState<NormalizedAchievement[]>([]);
  const [missions, setMissions] = useState<UserDailyMission[]>([]);
  const [adminAchievements, setAdminAchievements] = useState<Achievement[]>([]);
  const [adminMissions, setAdminMissions] = useState<DailyMission[]>([]);
  const [publicUserId, setPublicUserId] = useState("");
  const [publicAchievements, setPublicAchievements] = useState<NormalizedAchievement[]>([]);
  const [achievementForm, setAchievementForm] = useState<AchievementForm>(emptyAchievementForm);
  const [missionForm, setMissionForm] = useState<MissionForm>(emptyMissionForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showcasedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.showcased),
    [achievements],
  );

  const fetchStudentData = useCallback(async () => {
    if (!userId) {
      return;
    }

    const [scoreData, missionData, achievementData] = await Promise.all([
      requestJson<StudentScore>(API.achievement.studentScore(userId)),
      requestJson<UserDailyMission[]>(API.achievement.studentMissions(userId)),
      requestJson<UserAchievement[]>(API.achievement.myAchievements)
        .catch(() => requestJson<UserAchievement[]>(API.achievement.userAchievements(userId))),
    ]);

    setScore(scoreData.score ?? scoreData.totalScore ?? 0);
    setMissions(missionData);
    setAchievements(achievementData.map(normalizeAchievement));
  }, [userId]);

  const fetchAdminData = useCallback(async () => {
    if (!isAdmin) {
      return;
    }

    const [achievementData, missionData] = await Promise.all([
      requestJson<Achievement[]>(API.achievement.adminAchievements),
      requestJson<DailyMission[]>(API.achievement.adminDailyMissions),
    ]);

    setAdminAchievements(achievementData);
    setAdminMissions(missionData);
  }, [isAdmin]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStudentData(), fetchAdminData()]);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal memuat data achievement."));
    } finally {
      setLoading(false);
    }
  }, [fetchAdminData, fetchStudentData]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      void Promise.resolve().then(refreshData);
    }
  }, [isAuthenticated, refreshData, userId]);

  async function handleToggleShowcase(achievementId: number, currentStatus: boolean) {
    const nextStatus = !currentStatus;
    if (nextStatus && showcasedAchievements.length >= SHOWCASE_LIMIT) {
      setError(`Maksimal ${SHOWCASE_LIMIT} achievement yang bisa ditampilkan di profil.`);
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<UserAchievement>(API.achievement.featured(String(achievementId), nextStatus), {
        method: "PUT",
      });
      setMessage(nextStatus ? "Achievement ditampilkan di profil." : "Achievement disembunyikan dari profil.");
      await fetchStudentData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal mengubah showcase achievement."));
    } finally {
      setSaving(false);
    }
  }

  async function handleClaimMission(missionId: number) {
    if (!userId) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<UserDailyMission>(API.achievement.claimMission(userId, String(missionId)), {
        method: "POST",
      });
      setMessage("Reward daily mission berhasil diklaim.");
      await fetchStudentData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal klaim reward daily mission."));
    } finally {
      setSaving(false);
    }
  }

  async function handleFindPublicProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!publicUserId.trim()) {
      setError("Masukkan user ID pelajar yang ingin dilihat.");
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await requestJson<UserAchievement[]>(
        API.achievement.completedAchievements(publicUserId.trim()),
      );
      setPublicAchievements(data.map(normalizeAchievement));
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal memuat profil publik pelajar."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAchievement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      title: achievementForm.title.trim(),
      description: achievementForm.description.trim(),
      milestone: Number(achievementForm.milestone),
      milestoneType: achievementForm.milestoneType,
    };
    const url = achievementForm.id
      ? API.achievement.adminAchievementById(String(achievementForm.id))
      : API.achievement.adminAchievements;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<Achievement>(url, {
        method: achievementForm.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setAchievementForm(emptyAchievementForm);
      setMessage(achievementForm.id ? "Achievement berhasil diupdate." : "Achievement berhasil dibuat.");
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan achievement."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAchievement(id: number) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<void>(API.achievement.adminAchievementById(String(id)), {
        method: "DELETE",
      });
      setMessage("Achievement berhasil dihapus.");
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus achievement."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      title: missionForm.title.trim(),
      description: missionForm.description.trim(),
      targetMilestone: Number(missionForm.targetMilestone),
      rewardPoints: Number(missionForm.rewardPoints),
      missionType: missionForm.missionType,
      activeDate: missionForm.activeDate,
    };
    const url = missionForm.id
      ? API.achievement.adminDailyMissionById(String(missionForm.id))
      : API.achievement.adminDailyMissions;

    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<DailyMission>(url, {
        method: missionForm.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setMissionForm(emptyMissionForm);
      setMessage(missionForm.id ? "Daily mission berhasil diupdate." : "Daily mission berhasil dibuat.");
      await fetchAdminData();
      await fetchStudentData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan daily mission."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteMission(id: number) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await requestJson<void>(API.achievement.adminDailyMissionById(String(id)), {
        method: "DELETE",
      });
      setMessage("Daily mission berhasil dihapus.");
      await fetchAdminData();
      await fetchStudentData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus daily mission."));
    } finally {
      setSaving(false);
    }
  }

  function renderMissionList() {
    if (loading) {
      return <LoadingState message="Memuat daily mission..." />;
    }

    if (missions.length === 0) {
      return <EmptyState title="Belum ada daily mission aktif" description="Daily mission aktif akan tampil di sini." />;
    }

    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        {missions.map((mission) => {
          const target = mission.dailyMission.targetMilestone;
          const percent = toProgressPercent(mission.currentProgress, target);
          const canClaim = mission.completed && !mission.rewardClaimed;

          return (
            <Card key={mission.id} style={{ padding: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ minWidth: 240, flex: 1 }}>
                  <Badge variant={mission.completed ? "success" : "info"} size="sm">
                    {mission.completed ? "Completed" : getMilestoneLabel(mission.dailyMission.missionType)}
                  </Badge>
                  <h3 style={{ margin: "0.5rem 0 0.25rem", fontSize: "1.1rem" }}>
                    {mission.dailyMission.title}
                  </h3>
                  <p style={{ margin: 0, color: "var(--text-soft)" }}>{mission.dailyMission.description}</p>
                </div>
                <div style={{ minWidth: 160, textAlign: "right" }}>
                  <strong>{mission.currentProgress} / {target}</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "var(--text-soft)" }}>
                    Reward {mission.dailyMission.rewardPoints} pts
                  </p>
                </div>
              </div>
              <Progress value={percent} color={mission.completed ? "success" : "brand"} style={{ marginTop: "1rem" }} />
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <Button
                  type="button"
                  variant={canClaim ? "success" : "secondary"}
                  disabled={!canClaim || saving}
                  onClick={() => void handleClaimMission(mission.dailyMission.id)}
                >
                  {mission.rewardClaimed ? "Reward claimed" : canClaim ? "Claim reward" : "Belum selesai"}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  function renderAchievementList(items: NormalizedAchievement[], allowShowcase: boolean) {
    if (loading && allowShowcase) {
      return <LoadingState message="Memuat achievement..." />;
    }

    if (items.length === 0) {
      return <EmptyState title="Belum ada achievement selesai" description="Achievement selesai akan tampil di sini." />;
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" }}>
        {items.map((achievement) => (
          <Card key={`${achievement.userAchievementId}-${achievement.achievementId}`} style={{ padding: "1.25rem" }}>
            <Badge variant={achievement.showcased ? "warning" : "brand"} size="sm">
              {achievement.showcased ? "Showcase" : getMilestoneLabel(achievement.milestoneType)}
            </Badge>
            <h3 style={{ margin: "0.75rem 0 0.35rem", fontSize: "1.1rem" }}>{achievement.title}</h3>
            <p style={{ margin: 0, color: "var(--text-soft)" }}>{achievement.description}</p>
            <p style={{ margin: "0.75rem 0 0", fontWeight: 700 }}>Milestone {achievement.milestone}</p>
            {allowShowcase && (
              <Button
                type="button"
                variant={achievement.showcased ? "gold" : "secondary"}
                size="sm"
                style={{ marginTop: "1rem" }}
                disabled={saving}
                onClick={() => void handleToggleShowcase(achievement.achievementId, achievement.showcased)}
              >
                {achievement.showcased ? "Sembunyikan dari profil" : "Tampilkan di profil"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    );
  }

  function renderPublicProfile() {
    return (
      <div style={{ display: "grid", gap: "1.25rem" }}>
        <Card style={{ padding: "1.25rem" }}>
          <form onSubmit={(event) => void handleFindPublicProfile(event)} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "end" }}>
            <Input
              label="User ID pelajar"
              value={publicUserId}
              onChange={(event) => setPublicUserId(event.target.value)}
              placeholder="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
              style={{ minWidth: 320 }}
            />
            <Button type="submit" disabled={saving}>Lihat profile</Button>
          </form>
        </Card>
        {renderAchievementList(publicAchievements, false)}
      </div>
    );
  }

  function renderAchievementForm() {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <Card style={{ padding: "1.25rem" }}>
          <form onSubmit={(event) => void handleSaveAchievement(event)} style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <Input label="Nama achievement" value={achievementForm.title} required onChange={(event) => setAchievementForm({ ...achievementForm, title: event.target.value })} />
              <Input label="Milestone" type="number" min="1" value={achievementForm.milestone} required onChange={(event) => setAchievementForm({ ...achievementForm, milestone: event.target.value })} />
              <label className="yomu-input-wrapper">
                <span className="yomu-input-label">Milestone type</span>
                <select className="yomu-input" value={achievementForm.milestoneType} onChange={(event) => setAchievementForm({ ...achievementForm, milestoneType: event.target.value })}>
                  {MILESTONE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
            </div>
            <Textarea label="Deskripsi" value={achievementForm.description} required onChange={(event) => setAchievementForm({ ...achievementForm, description: event.target.value })} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button type="submit" disabled={saving}>{achievementForm.id ? "Update achievement" : "Buat achievement"}</Button>
              {achievementForm.id && (
                <Button type="button" variant="secondary" onClick={() => setAchievementForm(emptyAchievementForm)}>Batal edit</Button>
              )}
            </div>
          </form>
        </Card>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {adminAchievements.map((achievement) => (
            <Card key={achievement.id} style={{ padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <strong>{achievement.title}</strong>
                <p style={{ margin: "0.25rem 0", color: "var(--text-soft)" }}>{achievement.description}</p>
                <Badge variant="info" size="sm">{getMilestoneLabel(achievement.milestoneType)} - {achievement.milestone}</Badge>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setAchievementForm({
                  id: achievement.id,
                  title: achievement.title,
                  description: achievement.description,
                  milestone: String(achievement.milestone),
                  milestoneType: achievement.milestoneType || "QUIZ_COUNT",
                })}>
                  Edit
                </Button>
                <Button type="button" variant="danger" size="sm" disabled={saving} onClick={() => void handleDeleteAchievement(achievement.id)}>
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  function renderMissionForm() {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <Card style={{ padding: "1.25rem" }}>
          <form onSubmit={(event) => void handleSaveMission(event)} style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              <Input label="Nama mission" value={missionForm.title} required onChange={(event) => setMissionForm({ ...missionForm, title: event.target.value })} />
              <Input label="Target milestone" type="number" min="1" value={missionForm.targetMilestone} required onChange={(event) => setMissionForm({ ...missionForm, targetMilestone: event.target.value })} />
              <Input label="Reward points" type="number" min="0" value={missionForm.rewardPoints} required onChange={(event) => setMissionForm({ ...missionForm, rewardPoints: event.target.value })} />
              <Input label="Active date" type="date" value={missionForm.activeDate} required onChange={(event) => setMissionForm({ ...missionForm, activeDate: event.target.value })} />
              <label className="yomu-input-wrapper">
                <span className="yomu-input-label">Mission type</span>
                <select className="yomu-input" value={missionForm.missionType} onChange={(event) => setMissionForm({ ...missionForm, missionType: event.target.value })}>
                  {MILESTONE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
            </div>
            <Textarea label="Deskripsi" value={missionForm.description} required onChange={(event) => setMissionForm({ ...missionForm, description: event.target.value })} />
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <Button type="submit" disabled={saving}>{missionForm.id ? "Update daily mission" : "Buat daily mission"}</Button>
              {missionForm.id && (
                <Button type="button" variant="secondary" onClick={() => setMissionForm(emptyMissionForm)}>Batal edit</Button>
              )}
            </div>
          </form>
        </Card>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {adminMissions.map((mission) => (
            <Card key={mission.id} style={{ padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <strong>{mission.title}</strong>
                <p style={{ margin: "0.25rem 0", color: "var(--text-soft)" }}>{mission.description}</p>
                <Badge variant="info" size="sm">
                  {mission.missionType} - {mission.targetMilestone} target - {mission.rewardPoints} pts
                </Badge>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <Button type="button" variant="secondary" size="sm" onClick={() => setMissionForm({
                  id: mission.id,
                  title: mission.title,
                  description: mission.description,
                  targetMilestone: String(mission.targetMilestone),
                  rewardPoints: String(mission.rewardPoints),
                  missionType: mission.missionType,
                  activeDate: mission.activeDate || emptyMissionForm.activeDate,
                })}>
                  Edit
                </Button>
                <Button type="button" variant="danger" size="sm" disabled={saving} onClick={() => void handleDeleteMission(mission.id)}>
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const tabItems = [
    { id: "missions", label: "Daily Mission" },
    { id: "achievements", label: `Achievement Saya (${achievements.length})` },
    { id: "public", label: "Profile Publik" },
    ...(isAdmin
      ? [
          { id: "admin-achievements", label: "Admin Achievement" },
          { id: "admin-missions", label: "Admin Mission" },
        ]
      : []),
  ];

  return (
    <ProtectedRoute description="Masuk untuk melihat achievement dan daily mission.">
      <div style={{ padding: "2rem 0 4rem" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            <div>
              <p className="yomu-eyebrow">ACHIEVEMENT</p>
              <h1 style={{ margin: "0.25rem 0", fontSize: "2rem" }}>Gamifikasi Yomu</h1>
              <p style={{ margin: 0, color: "var(--text-soft)" }}>Score kamu saat ini: <strong>{score} pts</strong></p>
            </div>
            <Card style={{ padding: "1rem", minWidth: 220 }}>
              <strong>Showcase profile</strong>
              <p style={{ margin: "0.25rem 0 0", color: "var(--text-soft)" }}>
                {showcasedAchievements.length} / {SHOWCASE_LIMIT} achievement ditampilkan
              </p>
            </Card>
          </div>

          {error && (
            <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", border: "1px solid var(--error)", borderRadius: 8, color: "var(--error)" }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", border: "1px solid var(--success)", borderRadius: 8, color: "var(--success)" }}>
              {message}
            </div>
          )}

          <Tabs
            items={tabItems}
            active={activeTab}
            onChange={(tab) => isAchievementTab(tab) && setActiveTab(tab)}
          />

          <div style={{ marginTop: "1.5rem" }}>
            {activeTab === "missions" && renderMissionList()}
            {activeTab === "achievements" && renderAchievementList(achievements, true)}
            {activeTab === "public" && renderPublicProfile()}
            {activeTab === "admin-achievements" && renderAchievementForm()}
            {activeTab === "admin-missions" && renderMissionForm()}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
