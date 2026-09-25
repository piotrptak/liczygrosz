import { fetchTransactions } from '@/lib/api';
import { keys } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { endOfMonth, startOfMonth } from 'date-fns';

// Shared by the balance card and the list, so the dashboard makes a single request per month.
export const useMonthTransactions = (month: Date) => {
    const from = startOfMonth(month);
    const to = endOfMonth(month);
    return useQuery({
        queryKey: keys.transactionsRange(from, to),
        queryFn: () => fetchTransactions(from, to),
    });
};
