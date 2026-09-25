import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { authStorage } from './authStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!url && !!anonKey;

// The anon key is public by design; access to data is enforced by Row Level Security.
export const supabase = createClient(url || 'http://localhost', anonKey || 'missing-key', {
    auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        // Password recovery and e-mail confirmation links return to the web app with the session in the URL.
        detectSessionInUrl: Platform.OS === 'web',
    },
});
