import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { createOrGetUser } from '@/logic/userSession';

export function useTeachingContent(subtopicId: string) {
    const { uid } = createOrGetUser();

    const query = useQuery({
        queryKey: ['teaching', subtopicId],
        queryFn: () => api.getTeachingContent(subtopicId, uid),
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: !!subtopicId,
    });

    return query;
}
