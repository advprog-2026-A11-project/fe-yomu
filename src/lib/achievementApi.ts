const BASE_URL = process.env.NEXT_PUBLIC_ACHIEVEMENT_API_URL;

// ===================== TYPES =====================

export interface Achievement {
    id: number;
    title: string;
    description: string;
    milestone: number;
}

export interface DailyMission {
    id: number;
    title: string;
    description: string;
    targetMilestone: number;
    rewardPoints: number;
    activeDate?: string;
}

export interface UserAchievement {
    id: number;
    userId: string;
    achievementId: number;
    unlockedAt: string;
    achievement?: Achievement;
}

export interface UserDailyMission {
    id: number;
    userId: string;
    missionId: number;
    progress: number;
    completed: boolean;
    mission?: DailyMission;
}

// ===================== HELPER =====================

async function apiFetch<T>(
    path: string,
    token?: string | null,
    options: RequestInit = {}
): Promise<T> {
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
        cache: "no-store",
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status}: ${errText}`);
    }

    // Handle 204 No Content (misal dari DELETE)
    if (res.status === 204) return undefined as T;
    return res.json();
}

// ===================== ADMIN — ACHIEVEMENT =====================
export async function getAllAchievements(token?: string): Promise<Achievement[]> {
    return apiFetch<Achievement[]>("/api/admin/achievements", token);
}

export async function createAchievement(
    data: Omit<Achievement, "id">,
    token: string
): Promise<Achievement> {
    return apiFetch<Achievement>("/api/admin/achievements", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function updateAchievement(
    id: number,
    data: Omit<Achievement, "id">,
    token: string
): Promise<Achievement> {
    return apiFetch<Achievement>(`/api/admin/achievements/${id}`, token, {
        method: "PUT",
        body: JSON.stringify(data),
    });
}

export async function deleteAchievement(id: number, token: string): Promise<void> {
    return apiFetch<void>(`/api/admin/achievements/${id}`, token, {
        method: "DELETE",
    });
}

// ===================== ADMIN — DAILY MISSION =====================

export async function getAllDailyMissions(token: string): Promise<DailyMission[]> {
    return apiFetch<DailyMission[]>("/api/admin/daily-missions", token);
}

export async function createDailyMission(
    data: Omit<DailyMission, "id">,
    token: string
): Promise<DailyMission> {
    return apiFetch<DailyMission>("/api/admin/daily-missions", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
}

export async function deleteDailyMission(id: number, token: string): Promise<void> {
    return apiFetch<void>(`/api/admin/daily-missions/${id}`, token, {
        method: "DELETE",
    });
}

// ===================== STUDENT — ACHIEVEMENT =====================
export async function getMyAchievements(token: string): Promise<UserAchievement[]> {
    return apiFetch<UserAchievement[]>("/api/achievements/me", token);
}

export async function getPublicAchievements(userId: string): Promise<UserAchievement[]> {
    return apiFetch<UserAchievement[]>(`/api/achievements/${userId}/public`);
}

// ===================== STUDENT — DAILY MISSION PROGRESS =====================
export async function getStudentMissions(
    userId: string,
    token: string
): Promise<UserDailyMission[]> {
    return apiFetch<UserDailyMission[]>(`/api/student-progress/${userId}/missions`, token);
}

export async function updateMissionProgress(
    userId: string,
    missionId: number,
    progress: number,
    token: string
): Promise<UserDailyMission> {
    return apiFetch<UserDailyMission>(
        `/api/student-progress/${userId}/missions/${missionId}/progress`,
        token,
        {
            method: "PUT",
            body: JSON.stringify({ progress }),
        }
    );
}