// Device-local preferences used before sign-in (e.g. language of the login screen).
import Storage from 'expo-sqlite/kv-store';

export const getLocalPref = (key: string): string | null => Storage.getItemSync(key);
export const setLocalPref = (key: string, value: string) => Storage.setItemSync(key, value);
