import { v4 as uuid4 } from "uuid";
import { randomUserName } from "./random_username";

const USER_ID_KEY = "user_id";
const USER_NAME_KEY = "user_name";

export interface UserSession {
    uid: string;
    name: string;
    isNew: boolean;
}

let cachedSession: UserSession | null = null;

async function createUserInDB(uid: string, name: string): Promise<void> {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

    try {
        const response = await fetch(`${API_BASE}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: uid, name }),
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

export function createOrGetUser(): UserSession {
    if (cachedSession) {
        return cachedSession;
    }

    const storedUid = localStorage.getItem(USER_ID_KEY);
    const storedName = localStorage.getItem(USER_NAME_KEY);

    if (!storedUid || !storedName) {
        const uid = uuid4();
        const name = randomUserName();

        localStorage.setItem(USER_ID_KEY, uid);
        localStorage.setItem(USER_NAME_KEY, name);

        createUserInDB(uid, name);

        console.log('New user created:', { uid, name });

        cachedSession = {
            uid,
            name,
            isNew: true,
        };

        return cachedSession;
    }

    console.log('Existing user loaded:', { uid: storedUid, name: storedName });

    cachedSession = {
        uid: storedUid,
        name: storedName,
        isNew: false,
    };

    return cachedSession;
}

export function initializeUser(): void {
    createOrGetUser();
}
