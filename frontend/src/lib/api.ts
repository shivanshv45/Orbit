const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
    getCurriculum: async (userId: string) => {
        const res = await fetch(`${API_BASE}/api/curriculum?user_id=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch curriculum');
        return res.json();
    },

    getTeachingContent: async (subtopicId: string, userId: string) => {
        const res = await fetch(`${API_BASE}/api/teaching/${subtopicId}?user_id=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch teaching content');
        return res.json();
    },

    updateSubtopicScore: async (data: {
        user_id: string;
        subtopic_id: string;
        final_score: number;
    }) => {
        const res = await fetch(`${API_BASE}/api/attempts/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update score');
        return res.json();
    },
};
