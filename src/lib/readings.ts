// lib/readings.ts

const API_STUDENT = "/api/reading-student";
const API_ADMIN = "/api/reading-admin";

async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
    const headers = new Headers(options.headers);
    headers.set("Content-Type", "application/json");

    const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
    });

    if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorText = await response.text();
            try {
                const errorData = JSON.parse(errorText);
                if (errorData?.message) {
                    errorMsg += ` - ${errorData.message}`;
                } else if (errorText) {
                    errorMsg += ` - ${errorText}`;
                }
            } catch {
                if (errorText) errorMsg += ` - ${errorText}`;
            }
        } catch {
            // ignore
        }
        throw new Error(errorMsg);
    }

    if (response.status === 204) return null;

    const text = await response.text();
    if (!text) return null;

    return JSON.parse(text);
}

export const ReadingAPI = {
    // ── Student: Reading ──────────────────────────────────────────────────────

    getStudentReadings: async () => {
        return apiFetch(API_STUDENT);
    },

    getStudentReadingById: async (id: string) => {
        return apiFetch(`${API_STUDENT}/${id}`);
    },

    // GET /api/student/readings/stats  (endpoint baru — userId dari JWT)
    getUserStats: async () => {
        return apiFetch(`${API_STUDENT}/stats`);
    },

    // ── Student: Quiz ─────────────────────────────────────────────────────────

    getQuizQuestions: async (readingId: string) => {
        return apiFetch(`${API_STUDENT}/quiz/readings/${readingId}/questions`);
    },

    submitQuiz: async (readingId: string, data: any) => {
        return apiFetch(`${API_STUDENT}/quiz/readings/${readingId}/submit`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    getQuizResult: async (readingId: string) => {
        return apiFetch(`${API_STUDENT}/quiz/readings/${readingId}/result`);
    },

    // ── Admin: Reading ────────────────────────────────────────────────────────

    getReadingById: async (id: string) => {
        return apiFetch(`${API_ADMIN}/${id}`);
    },

    getQuestionsCount: async (id: string) => {
        return apiFetch(`${API_ADMIN}/${id}/questions/count`);
    },

    // ── Admin: Quiz ───────────────────────────────────────────────────────────

    getAdminQuizQuestions: async (readingId: string) => {
        return apiFetch(`${API_ADMIN}/${readingId}/questions`);
    },

    createAdminQuizQuestion: async (readingId: string, data: any) => {
        return apiFetch(`${API_ADMIN}/${readingId}/questions`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateAdminQuizQuestion: async (readingId: string, questionId: string, data: any) => {
        return apiFetch(`${API_ADMIN}/${readingId}/questions/${questionId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    deleteAdminQuizQuestion: async (readingId: string, questionId: string) => {
        return apiFetch(`${API_ADMIN}/${readingId}/questions/${questionId}`, {
            method: "DELETE",
        });
    },

    deleteAllAdminQuizQuestions: async (readingId: string) => {
        return apiFetch(`${API_ADMIN}/${readingId}/questions`, {
            method: "DELETE",
        });
    },
};
