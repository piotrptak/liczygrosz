import * as Localization from 'expo-localization';
import * as SQLite from 'expo-sqlite';

const DATABASE_VERSION = 2;

const DEFAULT_CATEGORIES = {
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

const addColumnIfMissing = async (db: SQLite.SQLiteDatabase, table: string, column: string, definition: string) => {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some(c => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

export const migrateDbIfNeeded = async (db: SQLite.SQLiteDatabase) => {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category TEXT NOT NULL,
      date INTEGER NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      icon TEXT,
      color TEXT
    );
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL, -- 'weekly', 'monthly'
      next_due_date INTEGER NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions (date);
  `);

  await addColumnIfMissing(db, 'transactions', 'currency', 'TEXT');
  await addColumnIfMissing(db, 'recurring_transactions', 'currency', 'TEXT');
  // Anchor for monthly schedules, so the 31st does not drift to the 28th after February.
  await addColumnIfMissing(db, 'recurring_transactions', 'start_date', 'INTEGER');

  const count = await db.getFirstAsync<{ count: number }>('SELECT count(*) as count FROM categories');
  if (count?.count === 0) {
    const lang = Localization.getLocales()[0]?.languageCode === 'pl' ? 'pl' : 'en';
    for (const [name, type, icon, color] of DEFAULT_CATEGORIES[lang]) {
      await db.runAsync('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)', [name, type, icon, color]);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
};

export const getSetting = (db: SQLite.SQLiteDatabase, key: string): string | null => {
  const row = db.getFirstSync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
};

export const setSetting = async (db: SQLite.SQLiteDatabase, key: string, value: string) => {
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
};
