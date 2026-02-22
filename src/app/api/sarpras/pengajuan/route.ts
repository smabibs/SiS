import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/sarpras/pengajuan
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const url = new URL(req.url);
        const status = url.searchParams.get('status') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params: (string | number)[] = [];
        if (status) { where += ' AND sp.status = ?'; params.push(status); }

        const countRow = db.prepare(`SELECT COUNT(*) as c FROM sarpras_pengajuan sp WHERE ${where}`).get(...params) as { c: number };

        const requests = db.prepare(`
            SELECT sp.*,
            (SELECT COUNT(*) FROM sarpras_pengajuan_items spi WHERE spi.pengajuan_id = sp.id) as item_count,
            (SELECT SUM(spi.quantity * spi.estimated_price) FROM sarpras_pengajuan_items spi WHERE spi.pengajuan_id = sp.id) as total_cost
            FROM sarpras_pengajuan sp
            WHERE ${where}
            ORDER BY CASE sp.status WHEN 'pending' THEN 0 WHEN 'disetujui' THEN 1 ELSE 2 END, sp.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return NextResponse.json({ requests, total: countRow.c, page, totalPages: Math.ceil(countRow.c / limit) });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// POST /api/sarpras/pengajuan
export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { requester_name, purpose, priority, notes, items } = body;

        if (!requester_name || !items || items.length === 0) {
            return NextResponse.json({ error: 'Nama pengaju dan item wajib diisi' }, { status: 400 });
        }

        const transaction = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO sarpras_pengajuan (requester_name, purpose, priority, notes)
                VALUES (?, ?, ?, ?)
            `).run(requester_name, purpose || null, priority || 'sedang', notes || null);

            const pengajuanId = result.lastInsertRowid;
            const insertItem = db.prepare(`
                INSERT INTO sarpras_pengajuan_items (pengajuan_id, item_name, quantity, unit, estimated_price, specification)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const item of items as { item_name: string; quantity: number; unit: string; estimated_price: number; specification: string }[]) {
                insertItem.run(pengajuanId, item.item_name, item.quantity || 1, item.unit || 'pcs', item.estimated_price || 0, item.specification || null);
            }

            logAudit('create', 'sarpras_pengajuan', pengajuanId, requester_name, `${items.length} jenis item`);
            return pengajuanId;
        });

        const pengajuanId = transaction();
        return NextResponse.json({ id: pengajuanId, success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
