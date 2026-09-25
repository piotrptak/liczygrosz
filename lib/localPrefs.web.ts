// Device-local preferences used before sign-in (e.g. language of the login screen).
export const getLocalPref = (key: string): string | null => {
    try {
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const setLocalPref = (key: string, value: string) => {
    try {
        window.localStorage.setItem(key, value);
    } catch {
        // Storage can be unavailable (private mode); the preference then lasts for this session only.
    }
};
