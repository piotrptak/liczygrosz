import * as SQLite from 'expo-sqlite';

export const migrateDbIfNeeded = async (db: SQLite.SQLiteDatabase) => {
  const DATABASE_VERSION = 1;

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
  `);

  // Migration: Add currency column if it doesn't exist
  try {
    await db.execAsync('ALTER TABLE transactions ADD COLUMN currency TEXT');
  } catch (e) {
    // Column likely exists
    // console.log('Currency column already exists in transactions');
  }

  try {
    await db.execAsync('ALTER TABLE recurring_transactions ADD COLUMN currency TEXT');
  } catch (e) {
    // Column likely exists
  }

  // Seed some categories if empty
  const result = await db.getAllAsync('SELECT count(*) as count FROM categories');
  // @ts-ignore
  if (result[0]?.count === 0) {
    await db.execAsync(`
        INSERT INTO categories (name, type, icon, color) VALUES 
        ('Salary', 'income', 'cash-outline', '#34C759'),
        ('Freelance', 'income', 'briefcase-outline', '#34C759'),
        ('Food', 'expense', 'fast-food-outline', '#FF9500'),
        ('Transport', 'expense', 'car-sport-outline', '#5856D6'),
        ('Entertainment', 'expense', 'game-controller-outline', '#AF52DE'),
        ('Shopping', 'expense', 'cart-outline', '#FF2D55'),
        ('Bills', 'expense', 'receipt-outline', '#FF3B30');
      `);
  }
};
