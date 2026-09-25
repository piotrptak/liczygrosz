import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Always revalidate on mount/focus: another device may have changed the data.
            // Cached data is still shown immediately while the refetch runs.
            staleTime: 0,
            // Keep cached data around so the app can show it offline.
            gcTime: 1000 * 60 * 60 * 24 * 7,
            retry: 1,
            networkMode: 'offlineFirst',
        },
        mutations: {
            networkMode: 'always',
        },
    },
});

export const keys = {
    transactions: ['transactions'] as const,
    transactionsRange: (from: Date, to: Date) => ['transactions', from.getTime(), to.getTime()] as const,
    transaction: (id: string) => ['transaction', id] as const,
    categories: ['categories'] as const,
    recurring: ['recurring'] as const,
    settings: ['settings'] as const,
};

export const invalidateTransactions = () =>
    Promise.all([
        queryClient.invalidateQueries({ queryKey: keys.transactions }),
        queryClient.invalidateQueries({ queryKey: ['transaction'] }),
    ]);
