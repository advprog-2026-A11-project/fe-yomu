"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/components/providers/auth-provider";
import { extractErrorMessage } from "@/lib/auth-client";

type Achievement = {
  id: number;
  title: string;
  description: string;
  milestone: number;
  milestoneType?: string | null;
  iconUrl?: string | null;
};

type DailyMission = {
  id: number;
  title: string;
  description: string;
  targetMilestone: number;
  rewardPoints: number;
  missionType?: string | null;
  active?: boolean;
  activeDate?: string | null;
};

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type AchievementForm = {
  title: string;
  description: string;
  milestone: string;
};

type MissionForm = {
  title: string;
  description: string;
  targetMilestone: string;
  rewardPoints: string;
  activeDate: string;
};

const emptyAchievementForm: AchievementForm = {
  title: "",
  description: "",
  milestone: "1",
};

const emptyMissionForm: MissionForm = {
  title: "",
  description: "",
  targetMilestone: "1",
  rewardPoints: "10",
  activeDate: "",
};

function unwrapApiData<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data as T;
  }
  return payload as T;
}

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export default function AchievementAdminPage() {
  const { isAdmin, status } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [achievementForm, setAchievementForm] = useState<AchievementForm>(emptyAchievementForm);
  const [missionForm, setMissionForm] = useState<MissionForm>(emptyMissionForm);
  const [editingAchievementId, setEditingAchievementId] = useState<number | null>(null);
  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"achievements" | "missions">("achievements");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = status === "authenticated" && isAdmin;

  async function fetchAdminData() {
    setLoading(true);
    setError(null);
    try {
      const [achievementResponse, missionResponse] = await Promise.all([
        fetch("/api/achievement/admin/achievements", { cache: "no-store" }),
        fetch("/api/achievement/admin/daily-missions", { cache: "no-store" }),
      ]);

      const achievementPayload = await achievementResponse.json();
      const missionPayload = await missionResponse.json();

      if (!achievementResponse.ok) {
        throw new Error(achievementPayload.message || "Failed to load achievements");
      }
      if (!missionResponse.ok) {
        throw new Error(missionPayload.message || "Failed to load daily missions");
      }

      setAchievements(unwrapApiData<Achievement[]>(achievementPayload) || []);
      setMissions(unwrapApiData<DailyMission[]>(missionPayload) || []);
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal memuat data admin achievement."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManage) {
      void fetchAdminData();
    }
  }, [canManage]);

  const editingAchievement = useMemo(
    () => achievements.find((item) => item.id === editingAchievementId) || null,
    [achievements, editingAchievementId]
  );

  const editingMission = useMemo(
    () => missions.find((item) => item.id === editingMissionId) || null,
    [missions, editingMissionId]
  );

  function resetAchievementForm() {
    setEditingAchievementId(null);
    setAchievementForm(emptyAchievementForm);
  }

  function resetMissionForm() {
    setEditingMissionId(null);
    setMissionForm(emptyMissionForm);
  }

  function startEditAchievement(item: Achievement) {
    setActivePanel("achievements");
    setEditingAchievementId(item.id);
    setAchievementForm({
      title: item.title,
      description: item.description,
      milestone: String(item.milestone),
    });
    setMessage(null);
    setError(null);
  }

  function startEditMission(item: DailyMission) {
    setActivePanel("missions");
    setEditingMissionId(item.id);
    setMissionForm({
      title: item.title,
      description: item.description,
      targetMilestone: String(item.targetMilestone),
      rewardPoints: String(item.rewardPoints),
      activeDate: toDateInputValue(item.activeDate),
    });
    setMessage(null);
    setError(null);
  }

  async function submitAchievement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        title: achievementForm.title.trim(),
        description: achievementForm.description.trim(),
        milestone: Number(achievementForm.milestone),
      };

      const response = await fetch(
        editingAchievementId
          ? `/api/achievement/admin/achievements/${editingAchievementId}`
          : "/api/achievement/admin/achievements",
        {
          method: editingAchievementId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save achievement");
      }

      setMessage(editingAchievementId ? "Achievement berhasil diperbarui." : "Achievement berhasil dibuat.");
      resetAchievementForm();
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan achievement."));
    } finally {
      setSaving(false);
    }
  }

  async function submitMission(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        title: missionForm.title.trim(),
        description: missionForm.description.trim(),
        targetMilestone: Number(missionForm.targetMilestone),
        rewardPoints: Number(missionForm.rewardPoints),
        ...(missionForm.activeDate ? { activeDate: missionForm.activeDate } : {}),
      };

      const response = await fetch(
        editingMissionId
          ? `/api/achievement/admin/daily-missions/${editingMissionId}`
          : "/api/achievement/admin/daily-missions",
        {
          method: editingMissionId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to save daily mission");
      }

      setMessage(editingMissionId ? "Daily mission berhasil diperbarui." : "Daily mission berhasil dibuat.");
      resetMissionForm();
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menyimpan daily mission."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteAchievement(id: number) {
    if (!confirm("Hapus achievement ini?")) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/achievement/admin/achievements/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete achievement");
      }
      setMessage("Achievement berhasil dihapus.");
      if (editingAchievementId === id) resetAchievementForm();
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus achievement."));
    }
  }

  async function deleteMission(id: number) {
    if (!confirm("Hapus daily mission ini?")) return;
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/achievement/admin/daily-missions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to delete daily mission");
      }
      setMessage("Daily mission berhasil dihapus.");
      if (editingMissionId === id) resetMissionForm();
      await fetchAdminData();
    } catch (err) {
      setError(extractErrorMessage(err, "Gagal menghapus daily mission."));
    }
  }

  return (
    <ProtectedRoute description="Masuk sebagai admin untuk mengelola achievement dan daily mission.">
      {!isAdmin ? (
        <div className="state-card" style={{ marginTop: "2rem" }}>
          <p className="eyebrow">ADMIN ONLY</p>
          <h2>Akses admin diperlukan</h2>
          <p className="muted-copy">
            Akun Anda tidak memiliki role ADMIN untuk mengelola achievement.
          </p>
          <Link href="/achievement/student" className="button button-primary state-card-action">
            Buka Achievement Saya
          </Link>
        </div>
      ) : (
        <main style={{ padding: "1.5rem 0 3rem", minHeight: "100vh" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>ADMIN ACHIEVEMENT</p>
              <h1 style={{ fontSize: "2.3rem", fontWeight: 850, margin: "0.25rem 0 0" }}>
                Kelola Achievement & Daily Mission
              </h1>
            </div>
            <Link href="/achievement/student" className="button">
              Lihat Tampilan User
            </Link>
          </div>

          {error ? <div className="form-feedback" style={{ color: "var(--error)", marginBottom: "1rem" }}>{error}</div> : null}
          {message ? <div className="form-feedback" style={{ color: "var(--success)", marginBottom: "1rem" }}>{message}</div> : null}

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className={activePanel === "achievements" ? "button button-primary" : "button"}
              onClick={() => setActivePanel("achievements")}
            >
              Achievements
            </button>
            <button
              type="button"
              className={activePanel === "missions" ? "button button-primary" : "button"}
              onClick={() => setActivePanel("missions")}
            >
              Daily Missions
            </button>
          </div>

          {activePanel === "achievements" ? (
            <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: "1.5rem", alignItems: "start" }}>
              <form className="panel-card" onSubmit={submitAchievement}>
                <p className="eyebrow">{editingAchievement ? "EDIT ACHIEVEMENT" : "CREATE ACHIEVEMENT"}</p>
                <h2>{editingAchievement ? editingAchievement.title : "Achievement Baru"}</h2>
                <label className="field">
                  <span>Nama</span>
                  <input
                    value={achievementForm.title}
                    onChange={(event) => setAchievementForm((form) => ({ ...form, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Deskripsi</span>
                  <textarea
                    value={achievementForm.description}
                    onChange={(event) => setAchievementForm((form) => ({ ...form, description: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Milestone</span>
                  <input
                    type="number"
                    min="1"
                    value={achievementForm.milestone}
                    onChange={(event) => setAchievementForm((form) => ({ ...form, milestone: event.target.value }))}
                    required
                  />
                </label>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button className="button button-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingAchievement ? "Update" : "Create"}
                  </button>
                  {editingAchievement ? (
                    <button className="button" type="button" onClick={resetAchievementForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="panel-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <p className="eyebrow" style={{ margin: 0 }}>DAFTAR ACHIEVEMENT</p>
                    <h2 style={{ margin: "0.25rem 0 0" }}>{achievements.length} item</h2>
                  </div>
                  <button className="button" type="button" onClick={() => void fetchAdminData()} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
                <AdminListEmpty loading={loading} count={achievements.length} label="achievement" />
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {achievements.map((item) => (
                    <AdminItem
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      meta={`Milestone ${item.milestone}${item.milestoneType ? ` · ${item.milestoneType}` : ""}`}
                      onEdit={() => startEditAchievement(item)}
                      onDelete={() => void deleteAchievement(item.id)}
                    />
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: "1.5rem", alignItems: "start" }}>
              <form className="panel-card" onSubmit={submitMission}>
                <p className="eyebrow">{editingMission ? "EDIT DAILY MISSION" : "CREATE DAILY MISSION"}</p>
                <h2>{editingMission ? editingMission.title : "Daily Mission Baru"}</h2>
                <label className="field">
                  <span>Nama</span>
                  <input
                    value={missionForm.title}
                    onChange={(event) => setMissionForm((form) => ({ ...form, title: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Deskripsi</span>
                  <textarea
                    value={missionForm.description}
                    onChange={(event) => setMissionForm((form) => ({ ...form, description: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Target Milestone</span>
                  <input
                    type="number"
                    min="1"
                    value={missionForm.targetMilestone}
                    onChange={(event) => setMissionForm((form) => ({ ...form, targetMilestone: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Reward Points</span>
                  <input
                    type="number"
                    min="0"
                    value={missionForm.rewardPoints}
                    onChange={(event) => setMissionForm((form) => ({ ...form, rewardPoints: event.target.value }))}
                    required
                  />
                </label>
                <label className="field">
                  <span>Active Date</span>
                  <input
                    type="date"
                    value={missionForm.activeDate}
                    onChange={(event) => setMissionForm((form) => ({ ...form, activeDate: event.target.value }))}
                  />
                </label>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button className="button button-primary" type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingMission ? "Update" : "Create"}
                  </button>
                  {editingMission ? (
                    <button className="button" type="button" onClick={resetMissionForm}>
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="panel-card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  <div>
                    <p className="eyebrow" style={{ margin: 0 }}>DAFTAR DAILY MISSION</p>
                    <h2 style={{ margin: "0.25rem 0 0" }}>{missions.length} item</h2>
                  </div>
                  <button className="button" type="button" onClick={() => void fetchAdminData()} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
                <AdminListEmpty loading={loading} count={missions.length} label="daily mission" />
                <div style={{ display: "grid", gap: "0.85rem" }}>
                  {missions.map((item) => (
                    <AdminItem
                      key={item.id}
                      title={item.title}
                      description={item.description}
                      meta={`Target ${item.targetMilestone} · +${item.rewardPoints} pts${item.activeDate ? ` · ${toDateInputValue(item.activeDate)}` : ""}`}
                      onEdit={() => startEditMission(item)}
                      onDelete={() => void deleteMission(item.id)}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      )}
    </ProtectedRoute>
  );
}

function AdminListEmpty({ loading, count, label }: { loading: boolean; count: number; label: string }) {
  if (loading || count > 0) return null;

  return (
    <div style={{ padding: "2rem", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-soft)" }}>
      Belum ada {label}.
    </div>
  );
}

function AdminItem({
  title,
  description,
  meta,
  onEdit,
  onDelete,
}: {
  title: string;
  description: string;
  meta: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
      <div style={{ minWidth: "240px", flex: 1 }}>
        <h3 style={{ margin: "0 0 0.3rem", fontSize: "1rem" }}>{title}</h3>
        <p className="muted-copy" style={{ margin: "0 0 0.4rem" }}>{description}</p>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-soft)" }}>{meta}</span>
      </div>
      <div style={{ display: "flex", gap: "0.6rem" }}>
        <button type="button" className="button" onClick={onEdit}>Edit</button>
        <button type="button" className="button" onClick={onDelete} style={{ color: "var(--error)" }}>Delete</button>
      </div>
    </article>
  );
}
