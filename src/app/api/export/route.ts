import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createWorkbook, styleHeaderRow, styleDataRows, addSignatureBlock, autoColumnWidth } from '@/lib/excelHelper';

export const dynamic = 'force-dynamic';

interface ItemRow {
    code: string; name: string; category_name: string; quantity: number;
    unit: string; condition: string; location: string; price: number;
}

interface LoanRow {
    borrower_name: string; borrower_class: string; purpose: string;
    loan_date: string; return_date: string; status: string; item_names: string;
}

interface RequestRow {
    requester_name: string; purpose: string; priority: string;
    request_date: string; status: string; total_cost: number;
}

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const url = new URL(req.url);
        const type = url.searchParams.get('type') || 'inventaris-alat';
        const dateFrom = url.searchParams.get('from') || '';
        const dateTo = url.searchParams.get('to') || '';

        // Get school info
        const settingsRows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
        const info: Record<string, string> = {};
        for (const row of settingsRows) info[row.key] = row.value;

        const schoolInfo = {
            school_name: info.school_name || 'Sekolah',
            school_address: info.school_address || '',
            school_npsn: info.school_npsn || '',
            lab_name: info.lab_name || 'Laboratorium IPA',
            lab_head: info.lab_head || '',
        };

        let title = '';
        let filename = '';

        if (type === 'inventaris-alat') {
            title = 'DAFTAR INVENTARIS ALAT LABORATORIUM IPA';
            filename = 'inventaris_alat.xlsx';
            const { workbook, sheet } = createWorkbook(title, schoolInfo);

            const headerRow = 7;
            sheet.getRow(headerRow).values = ['No', 'Kode', 'Nama Alat', 'Kategori', 'Jumlah', 'Satuan', 'Kondisi', 'Lokasi'];
            styleHeaderRow(sheet, headerRow);

            const items = db.prepare(`
                SELECT i.code, i.name, COALESCE(c.name, '-') as category_name, i.quantity, i.unit, i.condition, COALESCE(i.location, '-') as location, i.price
                FROM items i LEFT JOIN categories c ON c.id = i.category_id
                WHERE i.type = 'alat' ORDER BY i.code
            `).all() as ItemRow[];

            items.forEach((item, idx) => {
                sheet.getRow(headerRow + 1 + idx).values = [
                    idx + 1, item.code, item.name, item.category_name,
                    item.quantity, item.unit, item.condition, item.location
                ];
            });

            styleDataRows(sheet, headerRow + 1, headerRow + items.length);
            autoColumnWidth(sheet);
            sheet.getColumn(1).width = 4;   // No
            sheet.getColumn(3).width = 28;  // Nama Alat
            addSignatureBlock(sheet, headerRow + items.length + 1, schoolInfo);

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        if (type === 'inventaris-bahan') {
            title = 'DAFTAR INVENTARIS BAHAN LABORATORIUM IPA';
            filename = 'inventaris_bahan.xlsx';
            const { workbook, sheet } = createWorkbook(title, schoolInfo);

            const headerRow = 7;
            sheet.getRow(headerRow).values = ['No', 'Kode', 'Nama Bahan', 'Kategori', 'Jumlah', 'Satuan', 'Lokasi', 'Harga'];
            styleHeaderRow(sheet, headerRow);

            const items = db.prepare(`
                SELECT i.code, i.name, COALESCE(c.name, '-') as category_name, i.quantity, i.unit, COALESCE(i.location, '-') as location, i.price
                FROM items i LEFT JOIN categories c ON c.id = i.category_id
                WHERE i.type = 'bahan' ORDER BY i.code
            `).all() as ItemRow[];

            items.forEach((item, idx) => {
                sheet.getRow(headerRow + 1 + idx).values = [
                    idx + 1, item.code, item.name, item.category_name,
                    item.quantity, item.unit, item.location, item.price
                ];
                sheet.getRow(headerRow + 1 + idx).getCell(8).numFmt = '#,##0';
            });

            styleDataRows(sheet, headerRow + 1, headerRow + items.length);
            autoColumnWidth(sheet);
            sheet.getColumn(1).width = 4;   // No
            sheet.getColumn(3).width = 28;  // Nama Bahan
            addSignatureBlock(sheet, headerRow + items.length + 1, schoolInfo);

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        if (type === 'peminjaman') {
            title = 'LAPORAN PEMINJAMAN ALAT/BAHAN LABORATORIUM IPA';
            if (dateFrom && dateTo) title += ` (${dateFrom} s/d ${dateTo})`;
            filename = 'laporan_peminjaman.xlsx';
            const { workbook, sheet } = createWorkbook(title, schoolInfo);

            const headerRow = 7;
            sheet.getRow(headerRow).values = ['No', 'Peminjam', 'Kelas', 'Tujuan', 'Tgl Pinjam', 'Tgl Kembali', 'Status', 'Item'];
            styleHeaderRow(sheet, headerRow);

            let query = `
                SELECT l.borrower_name, COALESCE(l.borrower_class, '-') as borrower_class,
                COALESCE(l.purpose, '-') as purpose, l.loan_date, COALESCE(l.return_date, '-') as return_date, l.status,
                COALESCE((SELECT GROUP_CONCAT(i.name || ' (' || li.quantity || ')', ', ') FROM loan_items li JOIN items i ON i.id = li.item_id WHERE li.loan_id = l.id), '-') as item_names
                FROM loans l WHERE 1=1
            `;
            const params: string[] = [];
            if (dateFrom) { query += ' AND l.loan_date >= ?'; params.push(dateFrom); }
            if (dateTo) { query += ' AND l.loan_date <= ?'; params.push(dateTo); }
            query += ' ORDER BY l.loan_date DESC';

            const loans = db.prepare(query).all(...params) as LoanRow[];

            loans.forEach((loan, idx) => {
                sheet.getRow(headerRow + 1 + idx).values = [
                    idx + 1, loan.borrower_name, loan.borrower_class, loan.purpose,
                    loan.loan_date, loan.return_date,
                    loan.status === 'dipinjam' ? 'Dipinjam' : loan.status === 'dikembalikan' ? 'Dikembalikan' : 'Terlambat',
                    loan.item_names
                ];
            });

            styleDataRows(sheet, headerRow + 1, headerRow + loans.length);
            autoColumnWidth(sheet);
            sheet.getColumn(1).width = 4;   // No
            sheet.getColumn(2).width = 22;  // Peminjam
            sheet.getColumn(8).width = 30;  // Item
            addSignatureBlock(sheet, headerRow + loans.length + 1, schoolInfo);

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        if (type === 'pengajuan') {
            title = 'LAPORAN PENGAJUAN ALAT/BAHAN LABORATORIUM IPA';
            if (dateFrom && dateTo) title += ` (${dateFrom} s/d ${dateTo})`;
            filename = 'laporan_pengajuan.xlsx';
            const { workbook, sheet } = createWorkbook(title, schoolInfo, 7);

            const headerRow = 7;
            sheet.getRow(headerRow).values = ['No', 'Pengaju', 'Tujuan', 'Prioritas', 'Tgl Ajuan', 'Status', 'Estimasi Biaya'];
            styleHeaderRow(sheet, headerRow);

            let query = `
                SELECT r.requester_name, COALESCE(r.purpose, '-') as purpose, r.priority, r.request_date, r.status,
                COALESCE((SELECT SUM(ri.quantity * ri.estimated_price) FROM request_items ri WHERE ri.request_id = r.id), 0) as total_cost
                FROM requests r WHERE 1=1
            `;
            const params: string[] = [];
            if (dateFrom) { query += ' AND r.request_date >= ?'; params.push(dateFrom); }
            if (dateTo) { query += ' AND r.request_date <= ?'; params.push(dateTo); }
            query += ' ORDER BY r.request_date DESC';

            const requests = db.prepare(query).all(...params) as RequestRow[];

            requests.forEach((r, idx) => {
                const row = sheet.getRow(headerRow + 1 + idx);
                row.values = [
                    idx + 1, r.requester_name, r.purpose,
                    r.priority === 'tinggi' ? 'Tinggi' : r.priority === 'sedang' ? 'Sedang' : 'Rendah',
                    r.request_date,
                    r.status === 'pending' ? 'Pending' : r.status === 'disetujui' ? 'Disetujui' : r.status === 'ditolak' ? 'Ditolak' : 'Terpenuhi',
                    r.total_cost || 0
                ];
                row.getCell(7).numFmt = '#,##0';
            });

            styleDataRows(sheet, headerRow + 1, headerRow + requests.length);
            autoColumnWidth(sheet);
            sheet.getColumn(1).width = 4;   // No
            sheet.getColumn(2).width = 22;  // Pengaju
            addSignatureBlock(sheet, headerRow + requests.length + 1, schoolInfo);

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        if (type === 'sarpras-pengajuan') {
            title = 'LAPORAN PENGAJUAN INVENTARIS SARPRAS';
            if (dateFrom && dateTo) title += ` (${dateFrom} s/d ${dateTo})`;
            filename = 'laporan_pengajuan_sarpras.xlsx';
            const { workbook, sheet } = createWorkbook(title, schoolInfo, 7);

            const headerRow = 7;
            sheet.getRow(headerRow).values = ['No', 'Pengaju', 'Tujuan', 'Prioritas', 'Tgl Ajuan', 'Status', 'Estimasi Biaya'];
            styleHeaderRow(sheet, headerRow);

            let query = `
                SELECT sp.requester_name, COALESCE(sp.purpose, '-') as purpose, sp.priority, sp.request_date, sp.status,
                COALESCE((SELECT SUM(spi.quantity * spi.estimated_price) FROM sarpras_pengajuan_items spi WHERE spi.pengajuan_id = sp.id), 0) as total_cost
                FROM sarpras_pengajuan sp WHERE 1=1
            `;
            const params: string[] = [];
            if (dateFrom) { query += ' AND sp.request_date >= ?'; params.push(dateFrom); }
            if (dateTo) { query += ' AND sp.request_date <= ?'; params.push(dateTo); }
            query += ' ORDER BY sp.request_date DESC';

            const requests = db.prepare(query).all(...params) as RequestRow[];

            requests.forEach((r, idx) => {
                const row = sheet.getRow(headerRow + 1 + idx);
                row.values = [
                    idx + 1, r.requester_name, r.purpose,
                    r.priority === 'tinggi' ? 'Tinggi' : r.priority === 'sedang' ? 'Sedang' : 'Rendah',
                    r.request_date,
                    r.status === 'pending' ? 'Pending' : r.status === 'disetujui' ? 'Disetujui' : r.status === 'ditolak' ? 'Ditolak' : 'Terpenuhi',
                    r.total_cost || 0
                ];
                row.getCell(7).numFmt = '#,##0';
            });

            styleDataRows(sheet, headerRow + 1, headerRow + requests.length);
            autoColumnWidth(sheet);
            sheet.getColumn(1).width = 4;   // No
            sheet.getColumn(2).width = 22;  // Pengaju
            addSignatureBlock(sheet, headerRow + requests.length + 1, schoolInfo);

            const buffer = await workbook.xlsx.writeBuffer();
            return new NextResponse(buffer as ArrayBuffer, {
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json({ error: 'Tipe laporan tidak valid' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
