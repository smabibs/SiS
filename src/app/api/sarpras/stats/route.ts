import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
    try {
        const db = getDb();
        const stats = {
            totalRuangan: (db.prepare('SELECT COUNT(*) as count FROM sarpras_ruangan').get() as any).count,
            totalBarang: (db.prepare('SELECT COUNT(*) as count FROM sarpras_barang').get() as any).count,
            barangRusak: (db.prepare('SELECT COUNT(*) as count FROM sarpras_barang WHERE condition != \'baik\'').get() as any).count,
        };

        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
