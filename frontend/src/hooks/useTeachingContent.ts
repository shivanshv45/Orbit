import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';
import { useUser } from '@clerk/clerk-react';

export function useTeachingContent(subtopicId: string) {
    const { user } = useUser();
    const { uid } = createOrGetUser(user ? { id: user.id, fullName: user.fullName } : null);

    const query = useQuery({
        queryKey: ['teaching', subtopicId],
        queryFn: () => api.getTeachingContent(subtopicId, uid),
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: !!subtopicId,
    });

    return query;
}
