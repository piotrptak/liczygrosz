// Native: persist the Supabase session in expo-sqlite's key-value store.
import 'react-native-url-polyfill/auto';
import Storage from 'expo-sqlite/kv-store';

export const authStorage = Storage;
