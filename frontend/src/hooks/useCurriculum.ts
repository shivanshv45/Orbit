import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

export function useCurriculum(curriculumId?: string) {
    const { uid } = createOrGetUser();

    return useQuery({
        queryKey: ['curriculum', uid, curriculumId],
        queryFn: () => api.getCurriculum(uid, curriculumId),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
