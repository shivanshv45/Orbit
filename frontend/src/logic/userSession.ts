import { v4 as uuid4 } from "uuid";
import { randomUserName } from "./random_username";

const USER_ID_KEY = "user_id";
const USER_NAME_KEY = "user_name";
const IS_GUEST_KEY = "is_guest";

export interface UserSession {
    uid: string;
    name: string;
    isNew: boolean;
    isGuest: boolean;
}

let cachedSession: UserSession | null = null;

async function createUserInDB(uid: string, name: string, isGuest: boolean): Promise<void> {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: uid, name, is_guest: isGuest }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create user in database:', errorText);
        } else {
            console.log('User created successfully in database:', name);
        }
    } catch (error) {
        console.error('Error creating user in database:', error);
    }
}

export function createOrGetUser(clerkUser?: { id: string; fullName: string | null } | null): UserSession {
    if (clerkUser?.id) {
        const userName = clerkUser.fullName || clerkUser.id.split('_')[1] || 'User';

        const existingStoredUid = localStorage.getItem(USER_ID_KEY);
        const isNew = existingStoredUid !== clerkUser.id;

        localStorage.setItem(USER_ID_KEY, clerkUser.id);
        localStorage.setItem(USER_NAME_KEY, userName);
        localStorage.setItem(IS_GUEST_KEY, 'false');

        if (isNew) {
            createUserInDB(clerkUser.id, userName, false);
            console.log('Authenticated user created:', { uid: clerkUser.id, name: userName });
        }

        cachedSession = {
            uid: clerkUser.id,
            name: userName,
            isNew,
            isGuest: false,
        };

        return cachedSession;
    }

    if (cachedSession) {
        return cachedSession;
    }

    const storedUid = localStorage.getItem(USER_ID_KEY);
    const storedName = localStorage.getItem(USER_NAME_KEY);
    const storedIsGuest = localStorage.getItem(IS_GUEST_KEY);

    if (!storedUid || !storedName || storedIsGuest !== 'true') {
        const uid = `guest_${uuid4()}`;
        const name = randomUserName();

        localStorage.setItem(USER_ID_KEY, uid);
        localStorage.setItem(USER_NAME_KEY, name);
        localStorage.setItem(IS_GUEST_KEY, 'true');

        createUserInDB(uid, name, true);

        console.log('Guest user created:', { uid, name });

        cachedSession = {
            uid,
            name,
            isNew: true,
            isGuest: true,
        };

        return cachedSession;
    }

    console.log('Existing guest user loaded:', { uid: storedUid, name: storedName });

    cachedSession = {
        uid: storedUid,
        name: storedName,
        isNew: false,
        isGuest: storedIsGuest === 'true',
    };

    return cachedSession;
}

export function initializeUser(): void {
    createOrGetUser();
}

export function clearUserSession(): void {
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(IS_GUEST_KEY);
    cachedSession = null;
}
