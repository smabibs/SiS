import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'Tidak ada file yang diunggah' }, { status: 400 });

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer as ArrayBuffer) as any;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];

        if (!worksheet) return NextResponse.json({ error: 'Spreadsheet kosong' }, { status: 400 });

        const db = getDb();
        let addedCount = 0;
        let skipCount = 0;
        let errors: string[] = [];

        const insertItem = db.prepare(`
            INSERT INTO sarpras_barang (code, name, category, quantity, unit, condition, room_id, acquired_date, source, price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.transaction(() => {
            // Iterate over all rows starting from row 2 (assuming row 1 is header)
            // Expected headers: Kode, Nama Barang(Wajib), Kategori(Wajib), Qty, Satuan, Kondisi, ID Ruangan
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // skip header

                const getVal = (col: number) => {
                    const c = row.getCell(col);
                    return c.text ? c.text.trim() : '';
                };

                const numVal = (col: number) => {
                    const c = row.getCell(col);
                    return typeof c.value === 'number' ? c.value : parseFloat(c.text || '0');
                };

                const code = getVal(1) || null;
                const name = getVal(2);
                const category = getVal(3);
                const qty = numVal(4) || 0;
                const unit = getVal(5) || 'pcs';
                const condition = (getVal(6) || 'baik').toLowerCase();
                const roomName = getVal(7);
                const acquired_date = getVal(8) || null;
                const source = getVal(9) || null;
                const price = numVal(10) || 0;
                const notes = getVal(11) || null;

                if (!name || !category) {
                    skipCount++;
                    errors.push(`Baris ${rowNumber}: Nama Barang dan Kategori wajib diisi.`);
                    return;
                }

                let validCondition = ['baik', 'rusak ringan', 'rusak berat'].includes(condition) ? condition : 'baik';

                // Attempt to resolve room mapping
                let roomId = null;
                if (roomName) {
                    const room = db.prepare('SELECT id FROM sarpras_ruangan WHERE name LIKE ?').get(`%${roomName}%`) as { id: number } | undefined;
                    if (room) roomId = room.id;
                }

                try {
                    const res = insertItem.run(
                        code, name, category, qty, unit, validCondition, roomId, acquired_date, source, price, notes
                    );
                    logAudit('IMPORT', 'sarpras_barang', res.lastInsertRowid, name);
                    addedCount++;
                } catch (err: any) {
                    skipCount++;
                    errors.push(`Baris ${rowNumber}: Gagal import - ${err.message}`);
                }
            });
        })();

        return NextResponse.json({
            success: true,
            message: `Berhasil mengimpor ${addedCount} barang. Dilewatkan: ${skipCount}`,
            added: addedCount,
            skipped: skipCount,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'Gagal memproses file Excel: ' + e.message }, { status: 500 });
    }
}
