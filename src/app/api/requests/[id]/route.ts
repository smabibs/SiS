import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/requests/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(id);
        if (!request) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        const items = db.prepare('SELECT * FROM request_items WHERE request_id = ?').all(id);
        return NextResponse.json({ ...(request as object), items });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/requests/:id — update status
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const body = await req.json();
        const { status, rejection_reason } = body;

        const request = db.prepare('SELECT requester_name FROM requests WHERE id = ?').get(id) as { requester_name: string } | undefined;
        if (!request) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        db.prepare(`UPDATE requests SET status = ?, rejection_reason = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
            .run(status, rejection_reason || null, id);

        logAudit('update_status', 'request', id, request.requester_name, `Status: ${status}`);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// DELETE /api/requests/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const request = db.prepare('SELECT requester_name FROM requests WHERE id = ?').get(id) as { requester_name: string } | undefined;
        if (!request) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        db.prepare('DELETE FROM requests WHERE id = ?').run(id);
        logAudit('delete', 'request', id, request.requester_name);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
