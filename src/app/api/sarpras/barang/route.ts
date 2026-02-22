import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = `
            SELECT b.*, r.name as room_name 
            FROM sarpras_barang b
            LEFT JOIN sarpras_ruangan r ON b.room_id = r.id
        `;
        const params: (string | number)[] = [];

        if (search) {
            query += ' WHERE b.name LIKE ? OR b.code LIKE ? OR b.category LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY b.created_at DESC LIMIT ?';
        params.push(limit);

        const items = db.prepare(query).all(...params);
        return NextResponse.json(items);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { code, name, category, quantity, unit, condition, room_id, acquired_date, source, price, notes } = body;

        if (!name || !category) return NextResponse.json({ error: 'Nama dan Kategori barang wajib diisi' }, { status: 400 });

        const result = db.prepare(`
            INSERT INTO sarpras_barang (code, name, category, quantity, unit, condition, room_id, acquired_date, source, price, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(code || null, name, category, quantity || 0, unit || 'pcs', condition || 'baik', room_id || null, acquired_date || null, source || null, price || 0, notes || null);

        const newItem = db.prepare('SELECT b.*, r.name as room_name FROM sarpras_barang b LEFT JOIN sarpras_ruangan r ON b.room_id = r.id WHERE b.id = ?').get(result.lastInsertRowid);
        logAudit('CREATE', 'sarpras_barang', result.lastInsertRowid, name);
        return NextResponse.json(newItem, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { id, code, name, category, quantity, unit, condition, room_id, acquired_date, source, price, notes } = body;

        if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

        db.prepare(`
            UPDATE sarpras_barang 
            SET code=?, name=?, category=?, quantity=?, unit=?, condition=?, room_id=?, acquired_date=?, source=?, price=?, notes=?, updated_at=datetime('now','localtime')
            WHERE id=?
        `).run(code || null, name, category, quantity || 0, unit || 'pcs', condition || 'baik', room_id || null, acquired_date || null, source || null, price || 0, notes || null, id);

        const updatedItem = db.prepare('SELECT b.*, r.name as room_name FROM sarpras_barang b LEFT JOIN sarpras_ruangan r ON b.room_id = r.id WHERE b.id = ?').get(id);
        logAudit('UPDATE', 'sarpras_barang', id, name);
        return NextResponse.json(updatedItem);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

        const item = db.prepare('SELECT name FROM sarpras_barang WHERE id = ?').get(id) as { name: string } | undefined;
        if (!item) return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });

        db.prepare('DELETE FROM sarpras_barang WHERE id = ?').run(id);
        logAudit('DELETE', 'sarpras_barang', id, item.name);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
