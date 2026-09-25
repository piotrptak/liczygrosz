import { deleteAccount as deleteAccountRpc } from '@/lib/api';
import { persister } from '@/lib/persister';
import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type AuthContextType = {
    user: User | null;
    initializing: boolean;
    /** True after opening a password reset link, until a new password is set. */
    recovery: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    /** Returns true when the account still has to be confirmed via e-mail. */
    signUp: (email: string, password: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    sendPasswordReset: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};

// Where e-mail links (confirmation, password reset) send the user back to.
const appUrl = () => {
    if (Platform.OS !== 'web') return undefined;
    const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '';
    return `${window.location.origin}${base}/`;
};

const clearLocalData = async () => {
    queryClient.clear();
    await persister?.removeClient();
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [recovery, setRecovery] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setInitializing(false);
        });
        const { data } = supabase.auth.onAuthStateChange((event, next) => {
            setSession(next);
            if (event === 'PASSWORD_RECOVERY') setRecovery(true);
            if (event === 'SIGNED_OUT') {
                setRecovery(false);
                clearLocalData();
            }
        });
        return () => data.subscription.unsubscribe();
    }, []);

    const value = useMemo<AuthContextType>(() => ({
        user: session?.user ?? null,
        initializing,
        recovery,
        signIn: async (email, password) => {
            const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
            if (error) throw error;
        },
        signUp: async (email, password) => {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: { emailRedirectTo: appUrl() },
            });
            if (error) throw error;
            return !data.session;
        },
        signOut: async () => {
            await supabase.auth.signOut();
        },
        sendPasswordReset: async (email) => {
            const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: appUrl() });
            if (error) throw error;
        },
        updatePassword: async (password) => {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setRecovery(false);
        },
        deleteAccount: async () => {
            await deleteAccountRpc();
            await supabase.auth.signOut({ scope: 'local' });
            await clearLocalData();
        },
    }), [session, initializing, recovery]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
