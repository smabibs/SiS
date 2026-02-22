import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/categories
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const type = new URL(req.url).searchParams.get('type') || '';
        let query = 'SELECT * FROM categories';
        const params: string[] = [];
        if (type) {
            query += ' WHERE type = ?';
            params.push(type);
        }
        query += ' ORDER BY type, name';
        const categories = db.prepare(query).all(...params);
        return NextResponse.json(categories);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// POST /api/categories
export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const { name, type, description } = await req.json();
        if (!name || !type) return NextResponse.json({ error: 'Nama dan tipe wajib' }, { status: 400 });
        const result = db.prepare('INSERT INTO categories (name, type, description) VALUES (?, ?, ?)').run(name, type, description || null);
        return NextResponse.json({ id: result.lastInsertRowid, success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/categories (update by id in body)
export async function PUT(req: NextRequest) {
    try {
        const db = getDb();
        const { id, name, type, description } = await req.json();
        db.prepare('UPDATE categories SET name=?, type=?, description=? WHERE id=?').run(name, type, description || null, id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// DELETE /api/categories
export async function DELETE(req: NextRequest) {
    try {
        const db = getDb();
        const { id } = await req.json();
        db.prepare('DELETE FROM categories WHERE id = ?').run(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
