import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/settings
export async function GET() {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
        const settings: Record<string, string> = {};
        for (const row of rows) settings[row.key] = row.value;
        return NextResponse.json(settings);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/settings
export async function PUT(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json() as Record<string, string>;

        const upsert = db.prepare(`
            INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now','localtime'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `);

        const transaction = db.transaction(() => {
            for (const [key, value] of Object.entries(body)) {
                upsert.run(key, value);
            }
        });
        transaction();

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
