// lib/reading.ts
import { proxyToBackend } from "@/lib/backend-proxy";

// Gunakan backendBaseUrl dari environment variable
const READING_BACKEND_OPTIONS = {
    backendBaseUrl: process.env.NEXT_PUBLIC_BACKEND_BACAAN_QUIZ_URL
};

async function proxyToBacaanQuiz(path: string, method: string, headers?: Record<string, string>, body?: any) {
    if (!READING_BACKEND_OPTIONS.backendBaseUrl) {
        throw new Error("NEXT_PUBLIC_BACKEND_BACAAN_QUIZ_URL is not configured");
    }

    // Buat Request object (required oleh proxyToBackend)
    const request = new Request(`http://internal${path}`, {
        method,
        headers: {
            ...headers,
            ...(body && { "Content-Type": "application/json" }),
        },
        ...(body && { body: JSON.stringify(body) }),
    });

    // Gunakan proxyToBackend (akan otomatis mengambil token dari cookie)
    const response = await proxyToBackend(path, request, READING_BACKEND_OPTIONS);

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const ReadingAPI = {
    getStudentReadingById: async (id: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/student/readings/${id}`, "GET", { userId });
    },

    getReadingById: async (id: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${id}`, "GET", { userId });
    },

    getQuestionsCount: async (id: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${id}/questions/count`, "GET", { userId });
    },

    getQuizQuestions: async (readingId: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/student/quiz/readings/${readingId}/questions`, "GET", { userId });
    },

    submitQuiz: async (readingId: string, userId: string, data: any) => {
        return proxyToBacaanQuiz(`/api/student/quiz/readings/${readingId}/submit`, "POST", { userId }, data);
    },

    // Admin Quiz APIs
    getAdminQuizQuestions: async (readingId: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${readingId}/questions`, "GET", { userId });
    },

    createAdminQuizQuestion: async (readingId: string, userId: string, data: any) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${readingId}/questions`, "POST", { userId }, data);
    },

    updateAdminQuizQuestion: async (readingId: string, questionId: string, userId: string, data: any) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${readingId}/questions/${questionId}`, "PUT", { userId }, data);
    },

    deleteAdminQuizQuestion: async (readingId: string, questionId: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${readingId}/questions/${questionId}`, "DELETE", { userId });
    },

    deleteAllAdminQuizQuestions: async (readingId: string, userId: string) => {
        return proxyToBacaanQuiz(`/api/admin/readings/${readingId}/questions`, "DELETE", { userId });
    },
};