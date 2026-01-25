import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

export function useCurriculum() {
    const { uid } = createOrGetUser();

    return useQuery({
        queryKey: ['curriculum', uid],
        queryFn: () => api.getCurriculum(uid),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
