import { useUser } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createOrGetUser } from '@/logic/userSession';

const LAST_CLERK_USER_KEY = 'last_clerk_user_id';
const SAVED_GUEST_ID_KEY = 'saved_guest_user_id';
const SAVED_GUEST_NAME_KEY = 'saved_guest_user_name';

export function SessionObserver({ children }: { children: React.ReactNode }) {
    const { user, isLoaded } = useUser();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!isLoaded) return;

        const lastClerkUserId = localStorage.getItem(LAST_CLERK_USER_KEY);
        const currentClerkUserId = user?.id || null;

        if (lastClerkUserId && !currentClerkUserId) {
            localStorage.removeItem(LAST_CLERK_USER_KEY);

            const savedGuestId = localStorage.getItem(SAVED_GUEST_ID_KEY);
            const savedGuestName = localStorage.getItem(SAVED_GUEST_NAME_KEY);

            if (savedGuestId && savedGuestName) {
                localStorage.setItem('user_id', savedGuestId);
                localStorage.setItem('user_name', savedGuestName);
                localStorage.setItem('is_guest', 'true');
            } else {
                localStorage.removeItem('user_id');
                localStorage.removeItem('user_name');
                localStorage.removeItem('is_guest');
            }

            queryClient.clear();
            createOrGetUser(null, true);
            return;
        }

        if (currentClerkUserId && lastClerkUserId !== currentClerkUserId) {
            const currentUserId = localStorage.getItem('user_id');
            const currentUserName = localStorage.getItem('user_name');
            const isGuest = localStorage.getItem('is_guest') === 'true';

            if (isGuest && currentUserId && currentUserName) {
                localStorage.setItem(SAVED_GUEST_ID_KEY, currentUserId);
                localStorage.setItem(SAVED_GUEST_NAME_KEY, currentUserName);
            }

            localStorage.setItem(LAST_CLERK_USER_KEY, currentClerkUserId);
            queryClient.clear();
            createOrGetUser({ id: user!.id, fullName: user!.fullName }, true);
            return;
        }

        if (!currentClerkUserId && !lastClerkUserId) {
            createOrGetUser(null, true);
        }

    }, [user, isLoaded, queryClient]);

    return <>{children}</>;
}
