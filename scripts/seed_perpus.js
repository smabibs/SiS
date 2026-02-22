const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../labipa.db');
const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS perpus_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );
`);

console.log('Seeding Perpustakaan categories and subjects...');

const subjects = [
    { name: 'Matematika', color: '#EF4444', description: 'Pelajaran Matematika SMA' },
    { name: 'Fisika', color: '#F97316', description: 'Pelajaran Fisika SMA' },
    { name: 'Kimia', color: '#EAB308', description: 'Pelajaran Kimia SMA' },
    { name: 'Biologi', color: '#22C55E', description: 'Pelajaran Biologi SMA' },
    { name: 'Bahasa Indonesia', color: '#3B82F6', description: 'Pelajaran Bahasa Indonesia SMA' },
    { name: 'Bahasa Inggris', color: '#6366F1', description: 'Pelajaran Bahasa Inggris SMA' },
    { name: 'Sejarah', color: '#8B5CF6', description: 'Pelajaran Sejarah SMA' },
    { name: 'Geografi', color: '#EC4899', description: 'Pelajaran Geografi SMA' },
    { name: 'Ekonomi', color: '#14B8A6', description: 'Pelajaran Ekonomi SMA' },
    { name: 'Sosiologi', color: '#F59E0B', description: 'Pelajaran Sosiologi SMA' },
    { name: 'Pendidikan Agama', color: '#10B981', description: 'Pelajaran Pendidikan Agama SMA' },
    { name: 'PPKn', color: '#6366F1', description: 'Pendidikan Pancasila dan Kewarganegaraan' },
    { name: 'Seni Budaya', color: '#F43F5E', description: 'Pelajaran Seni Budaya SMA' },
    { name: 'Penjaskes', color: '#84CC16', description: 'Pendidikan Jasmani dan Kesehatan' },
    { name: 'TIK / Informatika', color: '#06B6D4', description: 'Teknologi Informasi dan Komunikasi' },
    { name: 'Sastra Indonesia', color: '#A78BFA', description: 'Sastra Indonesia' },
    { name: 'Umum / Fiksi', color: '#94A3B8', description: 'Buku umum, fiksi, dan pengembangan diri' },
];

const insertSubject = db.prepare('INSERT OR IGNORE INTO perpus_subjects (name, color, description) VALUES (?, ?, ?)');
for (const s of subjects) {
    insertSubject.run(s.name, s.color, s.description);
}

const categories = [
    { name: 'Buku Teks', description: 'Buku pelajaran utama' },
    { name: 'Buku Referensi', description: 'Kamus, ensiklopedia, atlas' },
    { name: 'Fiksi', description: 'Novel, cerpen, puisi' },
    { name: 'Non-Fiksi', description: 'Biografi, sejarah, sains populer' },
    { name: 'Majalah / Jurnal', description: 'Majalah dan jurnal ilmiah' },
    { name: 'Pengembangan Diri', description: 'Motivasi dan pengembangan diri' },
];

const insertCat = db.prepare('INSERT OR IGNORE INTO perpus_categories (name, description) VALUES (?, ?)');
for (const c of categories) {
    insertCat.run(c.name, c.description);
}

// Add a dummy settings for school_name
db.prepare("INSERT OR IGNORE INTO perpus_settings (key, value) VALUES ('school_name', 'SiPERPUS')").run();

console.log('Seeding complete.');
db.close();
