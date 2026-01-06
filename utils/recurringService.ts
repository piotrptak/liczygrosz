import * as SQLite from 'expo-sqlite';

export const processRecurringTransactions = async (db: SQLite.SQLiteDatabase) => {
    try {
        const now = Date.now();
        const recurring = await db.getAllAsync('SELECT * FROM recurring_transactions WHERE next_due_date <= ?', [now]);

        for (const item of (recurring as any[])) {
            // 1. Insert into main transactions
            await db.runAsync(
                'INSERT INTO transactions (amount, type, category, date, note) VALUES (?, ?, ?, ?, ?)',
                [item.amount, item.type, item.category, item.next_due_date, `Recurring: ${item.note || ''}`]
            );

            // 2. Calculate next due date
            let nextDate = new Date(item.next_due_date);
            if (item.frequency === 'weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (item.frequency === 'monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            // 3. Update next_due_date
            await db.runAsync('UPDATE recurring_transactions SET next_due_date = ? WHERE id = ?', [nextDate.getTime(), item.id]);
        }

    } catch (e) {
        console.error("Failed to process recurring transactions", e);
    }
};
