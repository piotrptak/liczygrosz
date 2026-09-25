import { addMonths, addWeeks, differenceInCalendarMonths } from 'date-fns';
import * as SQLite from 'expo-sqlite';

type RecurringItem = {
    id: number;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    frequency: 'weekly' | 'monthly';
    next_due_date: number;
    start_date: number | null;
    note: string | null;
    currency: string | null;
};

const nextOccurrence = (item: RecurringItem, current: Date) => {
    if (item.frequency === 'weekly') return addWeeks(current, 1);
    // Count months from the anchor date so month-end schedules keep their day.
    const start = new Date(item.start_date ?? item.next_due_date);
    return addMonths(start, differenceInCalendarMonths(current, start) + 1);
};

// Books every occurrence that is due (catching up on missed periods) and moves next_due_date forward.
export const processRecurringTransactions = async (db: SQLite.SQLiteDatabase) => {
    try {
        const now = Date.now();
        const due = await db.getAllAsync<RecurringItem>('SELECT * FROM recurring_transactions WHERE next_due_date <= ?', [now]);

        for (const item of due) {
            await db.withTransactionAsync(async () => {
                let dueDate = new Date(item.next_due_date);
                while (dueDate.getTime() <= now) {
                    await db.runAsync(
                        'INSERT INTO transactions (amount, type, category, date, note, currency) VALUES (?, ?, ?, ?, ?, ?)',
                        [item.amount, item.type, item.category, dueDate.getTime(), item.note ?? '', item.currency]
                    );
                    dueDate = nextOccurrence(item, dueDate);
                }
                await db.runAsync('UPDATE recurring_transactions SET next_due_date = ? WHERE id = ?', [dueDate.getTime(), item.id]);
            });
        }
    } catch (e) {
        console.error('Failed to process recurring transactions', e);
    }
};
