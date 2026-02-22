import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createWorkbook, styleHeaderRow, styleDataRows, addSignatureBlock, autoColumnWidth } from '@/lib/excelHelper';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') || 'barang';
        const db = getDb();

        const siteSettings = db.prepare('SELECT * FROM settings').all() as any[];
        const settingsMap: any = {};
        siteSettings.forEach(s => { settingsMap[s.key] = s.value; });

        // Build info object with fallback
        const info = {
            school_name: settingsMap.school_name || 'Sekolah',
            school_address: settingsMap.school_address || 'Alamat Sekolah',
            school_npsn: settingsMap.school_npsn || '-',
            lab_name: 'Pusat Sarana dan Prasarana', // Adapted for Sarpras
            lab_head: settingsMap.sarpras_head || 'Waka Sarpras/Koordinator',
        };

        const title = `LAPORAN DATA ${type.toUpperCase()}`;

        let colCount = 10;
        if (type === 'barang') colCount = 12;
        if (type === 'ruangan') colCount = 8;
        if (type === 'peminjaman') colCount = 9;

        const { workbook, sheet } = createWorkbook(title, info, colCount);

        // Define columns starting at row 7
        const headerRowIndex = 7;
        let startDataRow = 8;
        let records: any[] = [];

        if (type === 'barang') {
            records = db.prepare(`
                SELECT b.code, b.name, b.category, b.quantity, b.unit, b.condition, 
                       r.name as room_name, b.acquired_date, b.source, b.price, b.notes
                FROM sarpras_barang b
                LEFT JOIN sarpras_ruangan r ON b.room_id = r.id
                ORDER BY r.name, b.name
            `).all() as any[];

            sheet.getRow(headerRowIndex).values = [
                'No', 'Kode', 'Nama Barang', 'Kategori', 'Jumlah', 'Satuan',
                'Kondisi', 'Ruangan', 'Tgl Pengadaan', 'Sumber', 'Harga Satuan', 'Keterangan'
            ];

            records.forEach((row, i) => {
                sheet.addRow([
                    i + 1,
                    row.code || '-',
                    row.name,
                    row.category,
                    row.quantity,
                    row.unit,
                    String(row.condition).toUpperCase(),
                    row.room_name || 'Belum Ditempatkan',
                    row.acquired_date || '-',
                    row.source || '-',
                    row.price,
                    row.notes || '-'
                ]);
            });

        } else if (type === 'ruangan') {
            records = db.prepare(`SELECT * FROM sarpras_ruangan ORDER BY name`).all() as any[];

            sheet.getRow(headerRowIndex).values = [
                'No', 'Kode', 'Nama Ruangan', 'Tipe', 'Kapasitas', 'Lokasi', 'Kondisi', 'Keterangan'
            ];

            records.forEach((row, i) => {
                sheet.addRow([
                    i + 1,
                    row.code || '-',
                    row.name,
                    row.type,
                    row.capacity + ' orang',
                    row.location || '-',
                    String(row.condition).toUpperCase(),
                    row.notes || '-'
                ]);
            });

        } else if (type === 'peminjaman') {
            records = db.prepare(`SELECT * FROM sarpras_peminjaman ORDER BY borrow_date DESC`).all() as any[];

            sheet.getRow(headerRowIndex).values = [
                'No', 'Nama Peminjam', 'Kegiatan', 'Lokasi/Kelas', 'Tgl Pinjam',
                'Tgl Rencana Kembali', 'Tgl Aktual Kembali', 'Status', 'Keterangan'
            ];

            records.forEach((row, i) => {
                sheet.addRow([
                    i + 1,
                    row.borrower_name,
                    row.purpose || '-',
                    row.location || '-',
                    row.borrow_date || '-',
                    row.return_date || '-',
                    row.actual_return_date || '-',
                    String(row.status).toUpperCase(),
                    row.notes || '-'
                ]);
            });
        }

        const dataEndRow = startDataRow + records.length - 1;

        styleHeaderRow(sheet, headerRowIndex);
        if (records.length > 0) {
            styleDataRows(sheet, startDataRow, dataEndRow);
        }

        autoColumnWidth(sheet);
        addSignatureBlock(sheet, Math.max(dataEndRow, startDataRow), info);

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="Laporan_Sarpras_${type}_${new Date().toISOString().split('T')[0]}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        console.error('Export Error:', error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
