import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = 'SELECT * FROM sarpras_ruangan';
        const params: (string | number)[] = [];

        if (search) {
            query += ' WHERE name LIKE ? OR code LIKE ? OR type LIKE ?';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const rooms = db.prepare(query).all(...params);
        return NextResponse.json(rooms);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { code, name, type, capacity, location, condition, notes } = body;

        if (!name || !type) return NextResponse.json({ error: 'Nama dan Tipe ruangan wajib diisi' }, { status: 400 });

        const result = db.prepare(`
            INSERT INTO sarpras_ruangan (code, name, type, capacity, location, condition, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(code || null, name, type, capacity || 0, location || null, condition || 'baik', notes || null);

        const newRoom = db.prepare('SELECT * FROM sarpras_ruangan WHERE id = ?').get(result.lastInsertRowid);
        logAudit('CREATE', 'sarpras_ruangan', result.lastInsertRowid, name);
        return NextResponse.json(newRoom, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { id, code, name, type, capacity, location, condition, notes } = body;

        if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });

        db.prepare(`
            UPDATE sarpras_ruangan 
            SET code=?, name=?, type=?, capacity=?, location=?, condition=?, notes=?
            WHERE id=?
        `).run(code || null, name, type, capacity || 0, location || null, condition || 'baik', notes || null, id);

        const updatedRoom = db.prepare('SELECT * FROM sarpras_ruangan WHERE id = ?').get(id);
        logAudit('UPDATE', 'sarpras_ruangan', id, name);
        return NextResponse.json(updatedRoom);
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

        const room = db.prepare('SELECT name FROM sarpras_ruangan WHERE id = ?').get(id) as { name: string } | undefined;
        if (!room) return NextResponse.json({ error: 'Ruangan tidak ditemukan' }, { status: 404 });

        // Check if there are items in this room
        const itemsCount = db.prepare('SELECT COUNT(*) as c FROM sarpras_barang WHERE room_id = ?').get(id) as { c: number };
        if (itemsCount.c > 0) {
            return NextResponse.json({ error: `Tidak bisa menghapus ruangan: ada ${itemsCount.c} barang inventaris di dalamnya.` }, { status: 400 });
        }

        db.prepare('DELETE FROM sarpras_ruangan WHERE id = ?').run(id);
        logAudit('DELETE', 'sarpras_ruangan', id, room.name);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
