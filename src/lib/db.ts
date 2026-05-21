import * as SQLite from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      
      CREATE TABLE IF NOT EXISTS quran (
        id INTEGER PRIMARY KEY NOT NULL,
        surah_no INTEGER NOT NULL,
        ayah_no INTEGER NOT NULL,
        text_ar TEXT NOT NULL,
        text_en TEXT,
        text_bn TEXT
      );
      
      CREATE TABLE IF NOT EXISTS duas (
        id INTEGER PRIMARY KEY NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        text_ar TEXT,
        text_en TEXT,
        reference TEXT
      );

      CREATE TABLE IF NOT EXISTS tracker (
        date TEXT PRIMARY KEY NOT NULL,
        fajr BOOLEAN DEFAULT 0,
        dhuhr BOOLEAN DEFAULT 0,
        asr BOOLEAN DEFAULT 0,
        maghrib BOOLEAN DEFAULT 0,
        isha BOOLEAN DEFAULT 0,
        quran BOOLEAN DEFAULT 0,
        charity BOOLEAN DEFAULT 0,
        fasting BOOLEAN DEFAULT 0,
        dhikr BOOLEAN DEFAULT 0
      );
    `);
    
    // Insert some mock data just for scaffolding
    await db.runAsync(
      'INSERT INTO duas (category, title, text_ar, text_en, reference) VALUES (?, ?, ?, ?, ?)',
      ['morning', 'Waking up', 'الْحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', 'All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.', 'Al-Bukhari']
    );

    currentDbVersion = 1;
  }
  
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
