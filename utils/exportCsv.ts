import { format } from 'date-fns';
import * as SQLite from 'expo-sqlite';
import { Platform, Share } from 'react-native';

const escape = (value: unknown) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",;\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const buildTransactionsCsv = async (db: SQLite.SQLiteDatabase, fallbackCurrency: string) => {
    const rows = await db.getAllAsync<any>('SELECT date, type, category, amount, currency, note FROM transactions ORDER BY date');
    if (rows.length === 0) return null;
    const lines = [
        'date,type,category,amount,currency,note',
        ...rows.map(r => [
            format(new Date(r.date), 'yyyy-MM-dd'),
            r.type,
            r.category,
            r.amount.toFixed(2),
            r.currency || fallbackCurrency,
            r.note,
        ].map(escape).join(',')),
    ];
    return lines.join('\n');
};

// Returns false when there is nothing to export.
export const exportTransactions = async (db: SQLite.SQLiteDatabase, fallbackCurrency: string) => {
    const csv = await buildTransactionsCsv(db, fallbackCurrency);
    if (!csv) return false;
    const fileName = `liczygrosz-${format(new Date(), 'yyyy-MM-dd')}.csv`;

    if (Platform.OS === 'web') {
        // BOM so Excel opens UTF-8 (Polish characters) correctly.
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } else {
        await Share.share({ title: fileName, message: csv });
    }
    return true;
};
