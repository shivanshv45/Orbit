import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';
import { useUser } from '@clerk/clerk-react';

export function useCurriculum(curriculumId?: string) {
    const { user } = useUser();
    const { uid } = createOrGetUser(user ? { id: user.id, fullName: user.fullName } : null);

    return useQuery({
        queryKey: ['curriculum', uid, curriculumId],
        queryFn: () => api.getCurriculum(uid, curriculumId),
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
}
