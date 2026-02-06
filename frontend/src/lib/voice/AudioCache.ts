const DB_NAME = 'OrbitVoiceCache';
const STORE_NAME = 'audio_files';
const DB_VERSION = 1;

export class AudioCache {
    private db: IDBDatabase | null = null;
    private dbPromise: Promise<IDBDatabase>;

    constructor() {
        this.dbPromise = this.initDB();
    }

    private initDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    public async get(key: string): Promise<Blob | null> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(key);

                request.onerror = () => resolve(null);
                request.onsuccess = () => resolve(request.result || null);
            });
        } catch (e) {
            console.warn('AudioCache get failed', e);
            return null;
        }
    }

    public async set(key: string, blob: Blob): Promise<void> {
        try {
            const db = await this.dbPromise;
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.put(blob, key);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve();
            });
        } catch (e) {
            console.warn('AudioCache set failed', e);
        }
    }

    public async clear(): Promise<void> {
        const db = await this.dbPromise;
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).clear();
    }
}

export const audioCacheDB = new AudioCache();
