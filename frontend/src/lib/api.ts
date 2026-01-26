const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const api = {
    getCurriculum: async (userId: string, curriculumId?: string) => {
        const url = curriculumId
            ? `${API_BASE}/api/curriculum?user_id=${userId}&curriculum_id=${curriculumId}`
            : `${API_BASE}/api/curriculum?user_id=${userId}`;
        const res = await fetch(url);
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

    askAI: async (message: string, context: string) => {
        const res = await fetch(`${API_BASE}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, context }),
        });
        if (!res.ok) throw new Error('Failed to get AI response');
        return res.json();
    },

    submitCameraMetrics: async (data: {
        user_id: string;
        subtopic_id: string;
        session_duration: number;
        focus_score: number;
        confusion_level: number;
        fatigue_score: number;
        engagement: number;
        frustration: number;
        blink_rate: number;
        head_stability: number;
        engagement_score: number;
    }) => {
        const res = await fetch(`${API_BASE}/api/camera/metrics`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to submit camera metrics');
        return res.json();
    },
};
