import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/items/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const item = db.prepare(`
            SELECT i.*, c.name as category_name FROM items i
            LEFT JOIN categories c ON c.id = i.category_id
            WHERE i.id = ?
        `).get(id);
        if (!item) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        const mutations = db.prepare('SELECT * FROM stock_mutations WHERE item_id = ? ORDER BY created_at DESC LIMIT 20').all(id);

        return NextResponse.json({ ...item as object, mutations });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/items/:id
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const body = await req.json();
        const { code, name, type, category_id, quantity, unit, condition, location, acquired_date, source, price, min_stock, notes } = body;

        // Check old quantity for mutation
        const old = db.prepare('SELECT quantity, name FROM items WHERE id = ?').get(id) as { quantity: number; name: string } | undefined;
        if (!old) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        db.prepare(`
            UPDATE items SET code=?, name=?, type=?, category_id=?, quantity=?, unit=?, condition=?, location=?,
            acquired_date=?, source=?, price=?, min_stock=?, notes=?, updated_at=datetime('now','localtime')
            WHERE id=?
        `).run(code || null, name, type, category_id || null, quantity || 0, unit || 'pcs', condition || 'baik', location || null, acquired_date || null, source || null, price || 0, min_stock || 0, notes || null, id);

        // Record stock change
        const diff = (quantity || 0) - old.quantity;
        if (diff !== 0) {
            db.prepare(`INSERT INTO stock_mutations (item_id, type, quantity, reference, notes) VALUES (?, ?, ?, 'manual', ?)`).run(
                id,
                diff > 0 ? 'masuk' : 'keluar',
                Math.abs(diff),
                `Penyesuaian stok: ${old.quantity} → ${quantity}`
            );
        }

        logAudit('update', 'item', id, name || old.name);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// DELETE /api/items/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const item = db.prepare('SELECT name FROM items WHERE id = ?').get(id) as { name: string } | undefined;
        if (!item) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        db.prepare('DELETE FROM items WHERE id = ?').run(id);
        logAudit('delete', 'item', id, item.name);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
