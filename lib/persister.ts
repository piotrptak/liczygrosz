import type { Persister } from '@tanstack/react-query-persist-client';

// Native: no persisted query cache (the app is primarily used as a PWA).
export const persister: Persister | undefined = undefined;
