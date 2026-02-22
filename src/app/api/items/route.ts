import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/items
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const url = new URL(req.url);
        const search = url.searchParams.get('search') || '';
        const type = url.searchParams.get('type') || '';
        const categoryId = url.searchParams.get('category_id') || '';
        const condition = url.searchParams.get('condition') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params: (string | number)[] = [];

        if (search) {
            where += ' AND (i.name LIKE ? OR i.code LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (type) {
            where += ' AND i.type = ?';
            params.push(type);
        }
        if (categoryId) {
            where += ' AND i.category_id = ?';
            params.push(parseInt(categoryId));
        }
        if (condition) {
            where += ' AND i.condition = ?';
            params.push(condition);
        }

        const countRow = db.prepare(`SELECT COUNT(*) as c FROM items i WHERE ${where}`).get(...params) as { c: number };

        const items = db.prepare(`
            SELECT i.*, c.name as category_name
            FROM items i
            LEFT JOIN categories c ON c.id = i.category_id
            WHERE ${where}
            ORDER BY i.type ASC, i.name ASC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return NextResponse.json({
            items,
            total: countRow.c,
            page,
            totalPages: Math.ceil(countRow.c / limit),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// POST /api/items
export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { code, name, type, category_id, quantity, unit, condition, location, acquired_date, source, price, min_stock, notes } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Nama dan tipe wajib diisi' }, { status: 400 });
        }

        const result = db.prepare(`
            INSERT INTO items (code, name, type, category_id, quantity, unit, condition, location, acquired_date, source, price, min_stock, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(code || null, name, type, category_id || null, quantity || 0, unit || 'pcs', condition || 'baik', location || null, acquired_date || null, source || null, price || 0, min_stock || 0, notes || null);

        // Record stock mutation
        if ((quantity || 0) > 0) {
            db.prepare(`INSERT INTO stock_mutations (item_id, type, quantity, reference, notes) VALUES (?, 'masuk', ?, 'initial', 'Stok awal')`).run(result.lastInsertRowid, quantity || 0);
        }

        logAudit('create', 'item', result.lastInsertRowid, name, `Tipe: ${type}`);

        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
