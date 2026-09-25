import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Persists the last fetched data in localStorage so the PWA can show it offline.
export const persister = typeof window === 'undefined'
    ? undefined
    : createSyncStoragePersister({ storage: window.localStorage, key: 'liczygrosz-cache', throttleTime: 1000 });
