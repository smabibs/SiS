import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'labipa.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDb(db);
  }
  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

export function reopenDb() {
  closeDb();
  return getDb();
}

export function logAudit(
  action: string,
  entityType: string,
  entityId: string | number | bigint,
  entityName: string,
  details?: string
) {
  try {
    const d = getDb();
    d.prepare(`
      INSERT INTO audit_logs (action, entity_type, entity_id, entity_name, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(action, entityType, String(entityId), entityName, details || null);
  } catch {
    // Don't let audit logging break the main operation
  }
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('alat','bahan')),
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('alat','bahan')),
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      condition TEXT DEFAULT 'baik' CHECK(condition IN ('baik','rusak ringan','rusak berat')),
      location TEXT,
      acquired_date TEXT,
      source TEXT,
      price REAL DEFAULT 0,
      min_stock INTEGER DEFAULT 0,
      photo TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_name TEXT NOT NULL,
      borrower_class TEXT,
      purpose TEXT,
      subject TEXT,
      loan_date TEXT DEFAULT (date('now','localtime')),
      due_date TEXT,
      return_date TEXT,
      status TEXT DEFAULT 'dipinjam' CHECK(status IN ('dipinjam','dikembalikan','terlambat')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS loan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      returned_quantity INTEGER DEFAULT 0,
      condition_before TEXT DEFAULT 'baik',
      condition_after TEXT
    );

    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_name TEXT NOT NULL,
      purpose TEXT,
      request_date TEXT DEFAULT (date('now','localtime')),
      priority TEXT DEFAULT 'sedang' CHECK(priority IN ('rendah','sedang','tinggi')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disetujui','ditolak','terpenuhi')),
      rejection_reason TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS request_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT DEFAULT 'pcs',
      estimated_price REAL DEFAULT 0,
      specification TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_mutations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('masuk','keluar','penyesuaian')),
      quantity INTEGER NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      entity_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    -- SARPRAS TABLES
    CREATE TABLE IF NOT EXISTS sarpras_ruangan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      capacity INTEGER DEFAULT 0,
      location TEXT,
      condition TEXT DEFAULT 'baik' CHECK(condition IN ('baik','rusak ringan','rusak berat')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sarpras_barang (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      quantity INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'pcs',
      condition TEXT DEFAULT 'baik' CHECK(condition IN ('baik','rusak ringan','rusak berat')),
      room_id INTEGER REFERENCES sarpras_ruangan(id) ON DELETE SET NULL,
      acquired_date TEXT,
      source TEXT,
      price REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sarpras_peminjaman (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      borrower_name TEXT NOT NULL,
      purpose TEXT,
      location TEXT,
      borrow_date TEXT DEFAULT (date('now','localtime')),
      return_date TEXT,
      actual_return_date TEXT,
      status TEXT DEFAULT 'dipinjam' CHECK(status IN ('dipinjam','dikembalikan','terlambat')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sarpras_peminjaman_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL REFERENCES sarpras_peminjaman(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL CHECK(item_type IN ('ruangan','barang')),
      ruangan_id INTEGER REFERENCES sarpras_ruangan(id) ON DELETE SET NULL,
      barang_id INTEGER REFERENCES sarpras_barang(id) ON DELETE SET NULL,
      quantity INTEGER DEFAULT 1,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS sarpras_pengajuan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester_name TEXT NOT NULL,
      purpose TEXT,
      request_date TEXT DEFAULT (date('now','localtime')),
      priority TEXT DEFAULT 'sedang' CHECK(priority IN ('rendah','sedang','tinggi')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','disetujui','ditolak','terpenuhi')),
      rejection_reason TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS sarpras_pengajuan_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pengajuan_id INTEGER NOT NULL REFERENCES sarpras_pengajuan(id) ON DELETE CASCADE,
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit TEXT DEFAULT 'pcs',
      estimated_price REAL DEFAULT 0,
      specification TEXT
    );

    -- PERPUSTAKAAN TABLES
    CREATE TABLE IF NOT EXISTS perpus_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      color TEXT DEFAULT '#4F46E5',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT UNIQUE,
      title TEXT NOT NULL,
      author TEXT,
      publisher TEXT,
      year INTEGER,
      edition TEXT,
      subject_id INTEGER REFERENCES perpus_subjects(id) ON DELETE SET NULL,
      category_id INTEGER REFERENCES perpus_categories(id) ON DELETE SET NULL,
      total_copies INTEGER DEFAULT 1,
      available_copies INTEGER DEFAULT 1,
      shelf_location TEXT,
      description TEXT,
      language TEXT DEFAULT 'Indonesia',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('siswa','guru','staff')),
      class TEXT,
      major TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      photo TEXT,
      status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','nonaktif')),
      joined_at TEXT DEFAULT (datetime('now','localtime')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES perpus_books(id),
      member_id INTEGER NOT NULL REFERENCES perpus_members(id),
      quantity INTEGER DEFAULT 1,
      loan_date TEXT DEFAULT (datetime('now','localtime')),
      due_date TEXT NOT NULL,
      return_date TEXT,
      status TEXT DEFAULT 'dipinjam' CHECK(status IN ('dipinjam','dikembalikan','terlambat')),
      fine INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      book_id INTEGER NOT NULL REFERENCES perpus_books(id) ON DELETE CASCADE,
      member_id INTEGER NOT NULL REFERENCES perpus_members(id) ON DELETE CASCADE,
      reserved_at TEXT DEFAULT (datetime('now','localtime')),
      expires_at TEXT,
      status TEXT DEFAULT 'aktif' CHECK(status IN ('aktif','terpenuhi','dibatalkan')),
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366F1',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS perpus_book_tags (
      book_id INTEGER NOT NULL REFERENCES perpus_books(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES perpus_tags(id) ON DELETE CASCADE,
      PRIMARY KEY (book_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS perpus_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS perpus_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      entity_name TEXT,
      details TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
    CREATE INDEX IF NOT EXISTS idx_items_code ON items(code);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_loan_items_loan ON loan_items(loan_id);
    CREATE INDEX IF NOT EXISTS idx_loan_items_item ON loan_items(item_id);
    CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
    CREATE INDEX IF NOT EXISTS idx_request_items_req ON request_items(request_id);
    CREATE INDEX IF NOT EXISTS idx_stock_mutations_item ON stock_mutations(item_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type);
    CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_sarpras_barang_room ON sarpras_barang(room_id);
    CREATE INDEX IF NOT EXISTS idx_sarpras_pengajuan_status ON sarpras_pengajuan(status);

    CREATE INDEX IF NOT EXISTS idx_perpus_books_isbn ON perpus_books(isbn);
    CREATE INDEX IF NOT EXISTS idx_perpus_books_subject ON perpus_books(subject_id);
    CREATE INDEX IF NOT EXISTS idx_perpus_loans_status ON perpus_loans(status);
    CREATE INDEX IF NOT EXISTS idx_perpus_loans_member ON perpus_loans(member_id);
    CREATE INDEX IF NOT EXISTS idx_perpus_loans_book ON perpus_loans(book_id);
  `);


  // Seed default data if empty
  const catCount = db.prepare('SELECT COUNT(*) as c FROM categories').get() as { c: number };
  if (catCount.c === 0) {
    seedDefaultData(db);
  }
}

function seedDefaultData(db: Database.Database) {
  // Default categories for Alat
  const alatCategories = [
    { name: 'Alat Gelas', desc: 'Gelas kimia, tabung reaksi, erlenmeyer, dll' },
    { name: 'Alat Ukur', desc: 'Penggaris, neraca, termometer, stopwatch, dll' },
    { name: 'Alat Optik', desc: 'Mikroskop, lup, cermin, lensa, dll' },
    { name: 'Alat Listrik', desc: 'Multimeter, kabel, power supply, dll' },
    { name: 'Alat Keselamatan', desc: 'Kacamata lab, sarung tangan, jas lab, dll' },
    { name: 'Alat Peraga', desc: 'Model anatomi, globe, torso, dll' },
    { name: 'Alat Umum', desc: 'Statif, klem, pembakar bunsen, dll' },
  ];

  const bahanCategories = [
    { name: 'Bahan Kimia', desc: 'Asam, basa, garam, indikator, dll' },
    { name: 'Bahan Biologi', desc: 'Awetan, preparat, media kultur, dll' },
    { name: 'Bahan Habis Pakai', desc: 'Kertas saring, lakmus, kapas, dll' },
    { name: 'Bahan Fisika', desc: 'Magnet, pegas, beban, dll' },
  ];

  const insertCat = db.prepare('INSERT INTO categories (name, type, description) VALUES (?, ?, ?)');
  for (const c of alatCategories) insertCat.run(c.name, 'alat', c.desc);
  for (const c of bahanCategories) insertCat.run(c.name, 'bahan', c.desc);

  // Sample items (Alat)
  const sampleAlat = [
    { code: 'ALT-001', name: 'Mikroskop Binokuler', cat: 'Alat Optik', qty: 8, unit: 'unit', loc: 'Lemari A-1', price: 3500000, min: 2 },
    { code: 'ALT-002', name: 'Gelas Kimia 250ml', cat: 'Alat Gelas', qty: 20, unit: 'pcs', loc: 'Lemari B-1', price: 25000, min: 10 },
    { code: 'ALT-003', name: 'Tabung Reaksi', cat: 'Alat Gelas', qty: 50, unit: 'pcs', loc: 'Lemari B-2', price: 5000, min: 20 },
    { code: 'ALT-004', name: 'Erlenmeyer 250ml', cat: 'Alat Gelas', qty: 15, unit: 'pcs', loc: 'Lemari B-1', price: 35000, min: 5 },
    { code: 'ALT-005', name: 'Neraca Analitik', cat: 'Alat Ukur', qty: 4, unit: 'unit', loc: 'Meja Timbang', price: 5000000, min: 2 },
    { code: 'ALT-006', name: 'Termometer Alkohol', cat: 'Alat Ukur', qty: 12, unit: 'pcs', loc: 'Lemari C-1', price: 15000, min: 5 },
    { code: 'ALT-007', name: 'Bunsen Burner', cat: 'Alat Umum', qty: 10, unit: 'unit', loc: 'Lemari D-1', price: 150000, min: 4 },
    { code: 'ALT-008', name: 'Statif dan Klem', cat: 'Alat Umum', qty: 10, unit: 'set', loc: 'Lemari D-2', price: 200000, min: 4 },
    { code: 'ALT-009', name: 'Kacamata Safety', cat: 'Alat Keselamatan', qty: 30, unit: 'pcs', loc: 'Lemari E-1', price: 25000, min: 15 },
    { code: 'ALT-010', name: 'Jas Laboratorium', cat: 'Alat Keselamatan', qty: 20, unit: 'pcs', loc: 'Lemari E-2', price: 75000, min: 10 },
    { code: 'ALT-011', name: 'Multimeter Digital', cat: 'Alat Listrik', qty: 6, unit: 'unit', loc: 'Lemari F-1', price: 250000, min: 3 },
    { code: 'ALT-012', name: 'Torso Manusia', cat: 'Alat Peraga', qty: 2, unit: 'unit', loc: 'Rak Peraga', price: 2500000, min: 1 },
  ];

  const sampleBahan = [
    { code: 'BHN-001', name: 'HCl 37%', cat: 'Bahan Kimia', qty: 5, unit: 'liter', loc: 'Lemari Asam', price: 120000, min: 2 },
    { code: 'BHN-002', name: 'NaOH (soda api)', cat: 'Bahan Kimia', qty: 3, unit: 'kg', loc: 'Lemari Basa', price: 80000, min: 1 },
    { code: 'BHN-003', name: 'Indikator Universal', cat: 'Bahan Kimia', qty: 10, unit: 'pack', loc: 'Lemari B-3', price: 25000, min: 5 },
    { code: 'BHN-004', name: 'Alkohol 96%', cat: 'Bahan Kimia', qty: 8, unit: 'liter', loc: 'Lemari Bahan', price: 50000, min: 3 },
    { code: 'BHN-005', name: 'Kertas Saring', cat: 'Bahan Habis Pakai', qty: 20, unit: 'pack', loc: 'Laci Bahan', price: 15000, min: 10 },
    { code: 'BHN-006', name: 'Kertas Lakmus', cat: 'Bahan Habis Pakai', qty: 15, unit: 'pack', loc: 'Laci Bahan', price: 10000, min: 5 },
    { code: 'BHN-007', name: 'Preparat Awetan Sel', cat: 'Bahan Biologi', qty: 25, unit: 'pcs', loc: 'Lemari Preparat', price: 20000, min: 10 },
    { code: 'BHN-008', name: 'Magnet Batang', cat: 'Bahan Fisika', qty: 12, unit: 'pcs', loc: 'Lemari F-2', price: 15000, min: 5 },
  ];

  const getCatId = db.prepare('SELECT id FROM categories WHERE name = ? AND type = ?');
  const insertItem = db.prepare(`
    INSERT INTO items (code, name, type, category_id, quantity, unit, location, price, min_stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const a of sampleAlat) {
    const cat = getCatId.get(a.cat, 'alat') as { id: number } | undefined;
    insertItem.run(a.code, a.name, 'alat', cat?.id ?? null, a.qty, a.unit, a.loc, a.price, a.min);
  }
  for (const b of sampleBahan) {
    const cat = getCatId.get(b.cat, 'bahan') as { id: number } | undefined;
    insertItem.run(b.code, b.name, 'bahan', cat?.id ?? null, b.qty, b.unit, b.loc, b.price, b.min);
  }

  // Default settings
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const defaultSettings = [
    ['school_name', 'SMA Negeri 1 Contoh'],
    ['school_npsn', '20100001'],
    ['school_address', 'Jl. Pendidikan No. 1, Kota Contoh'],
    ['school_phone', '(021) 1234567'],
    ['school_email', 'info@sman1contoh.sch.id'],
    ['school_principal', 'Drs. Ahmad Surya, M.Pd'],
    ['school_logo', ''],
    ['lab_name', 'Laboratorium IPA'],
    ['lab_head', 'Sri Wahyuni, S.Pd., M.Si'],
    ['lab_location', 'Gedung B Lantai 2'],
    ['lab_assistant', 'Budi Santoso'],
  ];
  for (const [k, v] of defaultSettings) {
    insertSetting.run(k, v);
  }

  // Sample loans
  const allItems = db.prepare('SELECT id, name FROM items WHERE type = \'alat\' LIMIT 6').all() as { id: number; name: string }[];

  const insertLoan = db.prepare(`
    INSERT INTO loans (borrower_name, borrower_class, purpose, subject, loan_date, due_date, status)
    VALUES (?, ?, ?, ?, date('now','localtime','-' || ? || ' days'), date('now','localtime','+' || ? || ' days'), ?)
  `);
  const insertLoanItem = db.prepare(`
    INSERT INTO loan_items (loan_id, item_id, quantity, condition_before)
    VALUES (?, ?, ?, 'baik')
  `);

  if (allItems.length >= 4) {
    // Active loan
    const l1 = insertLoan.run('Pak Hendra - XI IPA 1', 'XI IPA 1', 'Praktikum Optik', 'Fisika', '2', '5', 'dipinjam');
    insertLoanItem.run(l1.lastInsertRowid, allItems[0].id, 4);

    // Another active
    const l2 = insertLoan.run('Bu Dewi - X IPA 2', 'X IPA 2', 'Praktikum Titrasi', 'Kimia', '1', '3', 'dipinjam');
    insertLoanItem.run(l2.lastInsertRowid, allItems[1].id, 10);
    insertLoanItem.run(l2.lastInsertRowid, allItems[3].id, 5);

    // Overdue
    const l3 = insertLoan.run('Pak Eko - XII IPA 1', 'XII IPA 1', 'Praktikum Listrik', 'Fisika', '10', '0', 'terlambat');
    insertLoanItem.run(l3.lastInsertRowid, allItems[2].id, 6);
  }

  // Sample requests
  const insertReq = db.prepare(`
    INSERT INTO requests (requester_name, purpose, priority, status, request_date)
    VALUES (?, ?, ?, ?, date('now','localtime','-' || ? || ' days'))
  `);
  const insertReqItem = db.prepare(`
    INSERT INTO request_items (request_id, item_name, quantity, unit, estimated_price, specification)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const r1 = insertReq.run('Sri Wahyuni, S.Pd', 'Penambahan alat praktikum semester genap', 'tinggi', 'pending', '3');
  insertReqItem.run(r1.lastInsertRowid, 'Mikroskop Monokuler', 5, 'unit', 2000000, 'Pembesaran 400x');
  insertReqItem.run(r1.lastInsertRowid, 'Gelas Ukur 100ml', 10, 'pcs', 30000, 'Borosilikat');

  const r2 = insertReq.run('Budi Santoso', 'Restock bahan kimia', 'sedang', 'disetujui', '7');
  insertReqItem.run(r2.lastInsertRowid, 'Asam Sulfat (H2SO4)', 3, 'liter', 150000, 'Grade AR');
  insertReqItem.run(r2.lastInsertRowid, 'Aquades', 20, 'liter', 5000, 'Steril');
}
