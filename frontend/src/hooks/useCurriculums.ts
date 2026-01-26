import { useQuery } from '@tanstack/react-query';
import { createOrGetUser } from '@/logic/userSession';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Curriculum {
    id: string;
    title: string;
    created_at: string;
}

async function fetchCurriculums(userId: string): Promise<{ curriculums: Curriculum[] }> {
    const res = await fetch(`${API_BASE}/api/curriculums?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch curriculums');
    return res.json();
}

export function useCurriculums() {
    const { uid } = createOrGetUser();

    return useQuery({
        queryKey: ['curriculums', uid],
        queryFn: () => fetchCurriculums(uid),
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 10 * 60 * 1000,   // 10 minutes
    });
}
