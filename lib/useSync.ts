import { useAuth } from '@/context/AuthContext';
import { processRecurring, seedDefaultCategories } from '@/lib/api';
import { invalidateTransactions, keys, queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { focusManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

const TABLE_KEYS: Record<string, () => Promise<unknown>> = {
    transactions: invalidateTransactions,
    categories: () => queryClient.invalidateQueries({ queryKey: keys.categories }),
    recurring_transactions: () => queryClient.invalidateQueries({ queryKey: keys.recurring }),
    user_settings: () => queryClient.invalidateQueries({ queryKey: keys.settings }),
};

const bookRecurring = async () => {
    const booked = await processRecurring();
    if (booked > 0) {
        await invalidateTransactions();
        await queryClient.invalidateQueries({ queryKey: keys.recurring });
    }
};

/**
 * Keeps every open device in sync: live updates via Supabase Realtime, plus a refetch
 * and recurring-item booking whenever the app comes back to the foreground.
 */
export const useSync = (locale: string) => {
    const { user } = useAuth();
    const userId = user?.id;

    useEffect(() => {
        if (!userId) return;

        seedDefaultCategories(locale)
            .then(() => queryClient.invalidateQueries({ queryKey: keys.categories }))
            .catch(console.error);
        bookRecurring().catch(console.error);

        // RLS limits inserts/updates to the user's own rows. Deletes cannot be filtered
        // (they only carry the primary key), so any delete simply triggers a refetch.
        const channel = supabase.channel(`user-${userId}`);
        for (const [table, invalidate] of Object.entries(TABLE_KEYS)) {
            channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => { invalidate(); });
        }
        channel.subscribe();

        const onForeground = () => { bookRecurring().catch(console.error); };
        let cleanupForeground: () => void;
        if (Platform.OS === 'web') {
            const onVisibility = () => { if (document.visibilityState === 'visible') onForeground(); };
            document.addEventListener('visibilitychange', onVisibility);
            cleanupForeground = () => document.removeEventListener('visibilitychange', onVisibility);
        } else {
            // Native has no window focus events; tell React Query about foreground changes too.
            const sub = AppState.addEventListener('change', (state) => {
                focusManager.setFocused(state === 'active');
                if (state === 'active') onForeground();
            });
            cleanupForeground = () => sub.remove();
        }

        return () => {
            supabase.removeChannel(channel);
            cleanupForeground();
        };
        // The locale only picks the language of the default categories on first sign-in.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);
};
