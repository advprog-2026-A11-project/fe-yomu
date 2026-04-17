const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_BACAAN_QUIZ_URL;

export const ReadingAPI = {
    getStudentReadings: async (userId: string) => {
        const res = await fetch(`${BASE_URL}/api/student/readings`, {
            headers: { userId },
        });
        return res.json();
    },

    getReadingById: async (id: string, userId: string) => {
        const res = await fetch(`${BASE_URL}/api/admin/readings/${id}`, {
            headers: { userId },
        });
        return res.json();
    },
};