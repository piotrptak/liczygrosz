import { format } from 'date-fns';
import { supabase } from './supabase';

export type TxType = 'income' | 'expense';

export type Transaction = {
    id: string;
    amount: number;
    type: TxType;
    category: string;
    /** Milliseconds since epoch. */
    date: number;
    note: string;
    currency: string;
};

export type TransactionInput = Omit<Transaction, 'id'>;

export type Category = { id: string; name: string; type: TxType; icon: string | null; color: string | null };

export type RecurringItem = {
    id: string;
    amount: number;
    type: TxType;
    category: string;
    frequency: 'weekly' | 'monthly';
    next_due_date: string;
    note: string;
    currency: string;
};

export type RecurringInput = Omit<RecurringItem, 'id' | 'next_due_date'> & { start_date: Date };

export type UserSettings = { locale: string | null; currency: string | null };

const must = <T>({ data, error }: { data: T; error: unknown }): T => {
    if (error) throw error;
    return data;
};

const rows = <T>({ data, error }: { data: T[] | null; error: unknown }): T[] => {
    if (error) throw error;
    return data ?? [];
};

const toTransaction = (row: any): Transaction => ({
    id: row.id,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: new Date(row.date).getTime(),
    note: row.note ?? '',
    currency: row.currency,
});

const toRow = (tx: TransactionInput) => ({ ...tx, date: new Date(tx.date).toISOString() });

// Transactions

export const fetchTransactions = async (from: Date, to: Date) =>
    rows(await supabase
        .from('transactions')
        .select('*')
        .gte('date', from.toISOString())
        .lte('date', to.toISOString())
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
    ).map(toTransaction);

export const fetchTransaction = async (id: string) => {
    const row = must(await supabase.from('transactions').select('*').eq('id', id).maybeSingle());
    return row ? toTransaction(row) : null;
};

export const fetchAllTransactions = async () => {
    // PostgREST returns at most 1000 rows per request, so page through everything.
    const pageSize = 1000;
    const all: Transaction[] = [];
    for (let from = 0; ; from += pageSize) {
        const page = rows(await supabase.from('transactions').select('*').order('date').range(from, from + pageSize - 1));
        all.push(...page.map(toTransaction));
        if (page.length < pageSize) return all;
    }
};

export const createTransaction = async (tx: TransactionInput) => {
    must(await supabase.from('transactions').insert(toRow(tx)));
};

export const updateTransaction = async (id: string, tx: TransactionInput) => {
    must(await supabase.from('transactions').update(toRow(tx)).eq('id', id));
};

export const deleteTransaction = async (id: string) => {
    must(await supabase.from('transactions').delete().eq('id', id));
};

// Categories

export const fetchCategories = async () =>
    rows(await supabase.from('categories').select('id, name, type, icon, color').order('name')) as Category[];

export const createCategory = async (category: Omit<Category, 'id'>) => {
    must(await supabase.from('categories').insert(category));
};

export const deleteCategory = async (id: string) => {
    must(await supabase.from('categories').delete().eq('id', id));
};

const DEFAULT_CATEGORIES: Record<string, [string, TxType, string, string][]> = {
    en: [
        ['Salary', 'income', 'cash-outline', '#34C759'],
        ['Freelance', 'income', 'briefcase-outline', '#30B0C7'],
        ['Food', 'expense', 'fast-food-outline', '#FF9500'],
        ['Transport', 'expense', 'car-sport-outline', '#5856D6'],
        ['Entertainment', 'expense', 'game-controller-outline', '#AF52DE'],
        ['Shopping', 'expense', 'cart-outline', '#FF2D55'],
        ['Bills', 'expense', 'receipt-outline', '#FF3B30'],
    ],
    pl: [
        ['Wynagrodzenie', 'income', 'cash-outline', '#34C759'],
        ['Zlecenia', 'income', 'briefcase-outline', '#30B0C7'],
        ['Jedzenie', 'expense', 'fast-food-outline', '#FF9500'],
        ['Transport', 'expense', 'car-sport-outline', '#5856D6'],
        ['Rozrywka', 'expense', 'game-controller-outline', '#AF52DE'],
        ['Zakupy', 'expense', 'cart-outline', '#FF2D55'],
        ['Rachunki', 'expense', 'receipt-outline', '#FF3B30'],
    ],
};

// First sign-in: create default categories. The unique (user_id, name) constraint
// makes this safe when two devices do it at the same time.
export const seedDefaultCategories = async (locale: string) => {
    const { count, error } = await supabase.from('categories').select('id', { count: 'exact', head: true });
    if (error) throw error;
    if (count) return;
    const rows = DEFAULT_CATEGORIES[locale === 'pl' ? 'pl' : 'en'].map(([name, type, icon, color]) => ({ name, type, icon, color }));
    must(await supabase.from('categories').upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true }));
};

// Recurring

export const fetchRecurring = async () =>
    rows(await supabase.from('recurring_transactions').select('*').order('next_due_date')).map((row: any) => ({
        ...row,
        amount: Number(row.amount),
    })) as RecurringItem[];

export const createRecurring = async ({ start_date, ...item }: RecurringInput) => {
    const start = format(start_date, 'yyyy-MM-dd');
    must(await supabase.from('recurring_transactions').insert({ ...item, start_date: start, next_due_date: start }));
};

export const deleteRecurring = async (id: string) => {
    must(await supabase.from('recurring_transactions').delete().eq('id', id));
};

/** Books due recurring occurrences on the server; returns how many were booked. */
export const processRecurring = async () =>
    must(await supabase.rpc('process_recurring', { p_today: format(new Date(), 'yyyy-MM-dd') })) as number;

// Settings and account

export const fetchSettings = async (): Promise<UserSettings> =>
    must(await supabase.from('user_settings').select('locale, currency').maybeSingle()) ?? { locale: null, currency: null };

export const saveSettings = async (userId: string, settings: Partial<UserSettings>) => {
    must(await supabase.from('user_settings').upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }));
};

export const deleteAccount = async () => {
    must(await supabase.rpc('delete_my_account'));
};
