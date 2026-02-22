import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { getDb, logAudit } from '@/lib/db';

// ── GET: Download template Excel ────────────────────────────────────────────
export async function GET() {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SiLabIPA';

    const db = getDb();
    const categories = db.prepare('SELECT id, name, type FROM categories ORDER BY type, name').all() as { id: number; name: string; type: string }[];

    // ── Sheet 1: Template Data ─────────────────────────────────────────────
    const ws = wb.addWorksheet('Data Alat & Bahan');

    const ACCENT = '0D9488';
    const COLS = [
        { header: 'Tipe *', key: 'type', width: 12, note: 'alat / bahan (WAJIB)' },
        { header: 'Kode', key: 'code', width: 14, note: 'Kode item (opsional, mis: ALT-001)' },
        { header: 'Nama *', key: 'name', width: 36, note: 'Nama alat/bahan (WAJIB)' },
        { header: 'Kategori', key: 'category', width: 24, note: 'Nama kategori (harus terdaftar)' },
        { header: 'Jumlah', key: 'quantity', width: 12, note: 'Jumlah stok (default: 0)' },
        { header: 'Satuan', key: 'unit', width: 12, note: 'pcs, unit, liter, ml, kg, gram, dll' },
        { header: 'Kondisi', key: 'condition', width: 16, note: 'baik / rusak ringan / rusak berat' },
        { header: 'Lokasi', key: 'location', width: 18, note: 'Lokasi penyimpanan (mis: Lemari A)' },
        { header: 'Harga (Rp)', key: 'price', width: 16, note: 'Harga satuan (angka, tanpa titik)' },
        { header: 'Stok Minimum', key: 'min_stock', width: 14, note: 'Batas stok minimum untuk peringatan' },
        { header: 'Sumber', key: 'source', width: 20, note: 'Asal perolehan (pembelian, hibah, dll)' },
        { header: 'Catatan', key: 'notes', width: 30, note: 'Catatan tambahan (opsional)' },
    ];

    ws.columns = COLS.map(c => ({ key: c.key, width: c.width }));

    // Header row
    const headerRow = ws.addRow(COLS.map(c => c.header));
    headerRow.height = 28;
    headerRow.eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ACCENT}` } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF10B981' } } };
    });

    // Freeze header
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    ws.autoFilter = { from: 'A1', to: 'L1' };

    // Data validation for Tipe column
    ws.getColumn('A').eachCell((cell: ExcelJS.Cell, rowNumber: number) => {
        if (rowNumber > 1) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: false,
                formulae: ['"alat,bahan"'],
                showErrorMessage: true,
                errorTitle: 'Tipe tidak valid',
                error: 'Pilih: alat atau bahan',
            };
        }
    });

    // Data validation for Kondisi column
    ws.getColumn('G').eachCell((cell: ExcelJS.Cell, rowNumber: number) => {
        if (rowNumber > 1) {
            cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"baik,rusak ringan,rusak berat"'],
            };
        }
    });

    // Sample rows
    const samples = [
        ['alat', 'ALT-001', 'Mikroskop Binokuler', 'Alat Optik', 5, 'unit', 'baik', 'Lemari A-1', 1500000, 2, 'Pembelian', 'Merk Olympus'],
        ['alat', 'ALT-002', 'Gelas Ukur 100ml', 'Alat Gelas', 20, 'pcs', 'baik', 'Lemari B-2', 35000, 5, 'Pembelian', ''],
        ['bahan', 'BHN-001', 'HCl (Asam Klorida)', 'Bahan Kimia', 3, 'liter', 'baik', 'Lemari Bahan', 85000, 1, 'Pembelian', 'Konsentrasi 37%'],
        ['bahan', 'BHN-002', 'Kertas Lakmus', 'Bahan Habis Pakai', 50, 'lembar', 'baik', 'Rak Bahan', 500, 10, 'Pembelian', ''],
    ];
    samples.forEach((row, i) => {
        const r = ws.addRow(row);
        r.height = 20;
        r.eachCell((cell: ExcelJS.Cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFF0FDFA' : 'FFFFFFFF' } };
            cell.alignment = { vertical: 'middle' };
            cell.font = { size: 10.5, color: { argb: 'FF1F2937' } };
        });
    });

    // ── Sheet 2: Petunjuk ──────────────────────────────────────────────────
    const wsInfo = wb.addWorksheet('📋 Petunjuk');
    wsInfo.getColumn('A').width = 28;
    wsInfo.getColumn('B').width = 60;

    const addInfoRow = (label: string, value: string, bold = false) => {
        const r = wsInfo.addRow([label, value]);
        r.getCell(1).font = { bold: true, size: 11, color: { argb: `FF${ACCENT}` } };
        r.getCell(2).font = { bold, size: 11 };
        r.height = 20;
    };

    wsInfo.addRow([]);
    addInfoRow('SiLabIPA — Template Import Alat & Bahan', '', true);
    wsInfo.addRow([]);
    addInfoRow('KOLOM WAJIB', 'Tipe (kolom A) dan Nama (kolom C)', true);
    addInfoRow('KOLOM OPSIONAL', 'Semua kolom lainnya');
    wsInfo.addRow([]);
    addInfoRow('Tipe', 'Harus diisi "alat" atau "bahan" (huruf kecil)');
    addInfoRow('Kategori', 'Harus sama persis dengan nama yang terdaftar di Pengaturan > Kategori');
    addInfoRow('Jumlah', 'Angka bulat, minimum 0. Kosong = 0');
    addInfoRow('Kondisi', 'baik / rusak ringan / rusak berat (default: baik)');
    addInfoRow('Harga', 'Angka tanpa titik/koma (mis: 150000)');
    wsInfo.addRow([]);
    addInfoRow('TIPS', 'Hapus baris contoh (baris 2-5) sebelum mengisi data Anda');
    addInfoRow('', 'Baris tanpa Tipe dan Nama akan diabaikan otomatis');
    addInfoRow('', 'Jika Kode sudah ada di database, item akan dilewati (tidak duplikat)');

    // ── Sheet 3: Daftar Kategori ───────────────────────────────────────────
    const wsCat = wb.addWorksheet('📂 Daftar Kategori');
    wsCat.getColumn('A').width = 30;
    wsCat.getColumn('B').width = 14;

    const catHeader = wsCat.addRow(['Nama Kategori', 'Tipe']);
    catHeader.eachCell((cell: ExcelJS.Cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ACCENT}` } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
    catHeader.height = 24;

    categories.forEach(cat => {
        const r = wsCat.addRow([cat.name, cat.type]);
        r.getCell(2).font = { size: 10.5 };
    });

    const buf = await wb.xlsx.writeBuffer();
    return new NextResponse(buf as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename="template-import-alat-bahan.xlsx"',
        },
    });
}

// ── POST: Parse & insert items from uploaded Excel ──────────────────────────
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'File Excel wajib diupload' }, { status: 400 });

        const buffer = new Uint8Array(await file.arrayBuffer()).buffer;
        const wb = new ExcelJS.Workbook();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (wb.xlsx as any).load(buffer);

        const ws = wb.worksheets[0];
        if (!ws) return NextResponse.json({ error: 'File tidak valid atau sheet kosong' }, { status: 400 });

        const db = getDb();

        // Cache categories by name+type (case-insensitive)
        const categories = db.prepare('SELECT id, name, type FROM categories').all() as { id: number; name: string; type: string }[];
        const categoryMap = new Map(
            categories.map(c => [`${c.type}:${c.name.toLowerCase().trim()}`, c.id])
        );

        const results = { imported: 0, skipped: 0, errors: [] as string[] };
        const insertStmt = db.prepare(`
            INSERT INTO items (code, name, type, category_id, quantity, unit, condition, location, price, min_stock, source, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertMutation = db.prepare(`
            INSERT INTO stock_mutations (item_id, type, quantity, reference, notes)
            VALUES (?, 'masuk', ?, 'import', 'Import dari Excel')
        `);

        ws.eachRow((row: ExcelJS.Row, idx: number) => {
            if (idx === 1) return; // skip header

            const vals = (row.values as ExcelJS.CellValue[]).slice(1);
            const type = String(vals[0] ?? '').trim().toLowerCase();
            const code = String(vals[1] ?? '').trim();
            const name = String(vals[2] ?? '').trim();
            const categoryName = String(vals[3] ?? '').trim();
            const quantityRaw = vals[4];
            const quantity = quantityRaw ? Math.max(0, parseInt(String(quantityRaw)) || 0) : 0;
            const unit = String(vals[5] ?? '').trim() || 'pcs';
            const condition = String(vals[6] ?? '').trim().toLowerCase() || 'baik';
            const location = String(vals[7] ?? '').trim() || null;
            const priceRaw = vals[8];
            const price = priceRaw ? parseInt(String(priceRaw).replace(/[.,]/g, '')) || 0 : 0;
            const minStockRaw = vals[9];
            const minStock = minStockRaw ? parseInt(String(minStockRaw)) || 0 : 0;
            const source = String(vals[10] ?? '').trim() || null;
            const notes = String(vals[11] ?? '').trim() || null;

            // Validate required fields
            if (!type || !name) return; // skip empty rows
            if (type !== 'alat' && type !== 'bahan') {
                results.errors.push(`Baris ${idx}: Tipe "${type}" tidak valid (harus alat/bahan)`);
                return;
            }

            // Check duplicate code
            if (code) {
                const exists = db.prepare('SELECT id FROM items WHERE code = ?').get(code);
                if (exists) {
                    results.skipped++;
                    results.errors.push(`Baris ${idx}: Kode "${code}" sudah ada, dilewati`);
                    return;
                }
            }

            // Resolve category
            let categoryId: number | null = null;
            if (categoryName) {
                categoryId = categoryMap.get(`${type}:${categoryName.toLowerCase()}`) ?? null;
                if (!categoryId) {
                    // Try without type prefix (cross-type match)
                    for (const [key, id] of categoryMap) {
                        if (key.endsWith(`:${categoryName.toLowerCase()}`)) {
                            categoryId = id;
                            break;
                        }
                    }
                    if (!categoryId) {
                        results.errors.push(`Baris ${idx}: Kategori "${categoryName}" tidak ditemukan, diabaikan`);
                    }
                }
            }

            // Validate condition
            const validConditions = ['baik', 'rusak ringan', 'rusak berat'];
            const finalCondition = validConditions.includes(condition) ? condition : 'baik';

            try {
                const result = insertStmt.run(
                    code || null, name, type, categoryId,
                    quantity, unit, finalCondition, location,
                    price, minStock, source, notes
                );

                // Record initial stock mutation
                if (quantity > 0) {
                    insertMutation.run(result.lastInsertRowid, quantity);
                }

                results.imported++;
            } catch (e) {
                results.errors.push(`Baris ${idx} ("${name}"): ${String(e)}`);
            }
        });

        if (results.imported === 0 && results.skipped === 0 && results.errors.length === 0) {
            return NextResponse.json({ error: 'File tidak berisi data item' }, { status: 400 });
        }

        logAudit('import', 'item', 0, 'Excel Import', `${results.imported} item berhasil diimport`);

        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: `Gagal membaca file: ${String(e)}` }, { status: 500 });
    }
}
