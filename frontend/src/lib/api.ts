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

    getUserStats: async (userId: string) => {
        const res = await fetch(`${API_BASE}/api/users/${userId}/stats`);
        if (!res.ok) throw new Error('Failed to fetch user stats');
        return res.json();
    },

    checkRevisionMilestone: async (userId: string, curriculumId: string) => {
        const res = await fetch(`${API_BASE}/api/revision/check-milestone?user_id=${userId}&curriculum_id=${curriculumId}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to check milestone');
        return res.json();
    },

    generateRevision: async (userId: string, curriculumId: string, milestone: number) => {
        const res = await fetch(`${API_BASE}/api/revision/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, curriculum_id: curriculumId, milestone }),
        });
        if (!res.ok) throw new Error('Failed to generate revision');
        return res.json();
    },

    submitRevisionResults: async (data: {
        userId: string;
        curriculumId: string;
        milestone: number;
        score: number;
        totalQuestions: number;
        correctAnswers: number;
    }) => {
        const res = await fetch(`${API_BASE}/api/revision/submit?user_id=${data.userId}&curriculum_id=${data.curriculumId}&milestone=${data.milestone}&score=${data.score}&total_questions=${data.totalQuestions}&correct_answers=${data.correctAnswers}`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to submit revision results');
        return res.json();
    },
};
