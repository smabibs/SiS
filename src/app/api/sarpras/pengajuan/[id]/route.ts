import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/sarpras/pengajuan/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const p = await params;
        const db = getDb();
        const id = parseInt(p.id);
        const reqData = db.prepare('SELECT * FROM sarpras_pengajuan WHERE id = ?').get(id) as any;
        if (!reqData) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const items = db.prepare('SELECT * FROM sarpras_pengajuan_items WHERE pengajuan_id = ?').all(id);
        return NextResponse.json({ ...reqData, items });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/sarpras/pengajuan/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const p = await params;
        const db = getDb();
        const id = parseInt(p.id);
        const body = await req.json();
        const { status, rejection_reason } = body;

        if (!status) return NextResponse.json({ error: 'Status wajib diisi' }, { status: 400 });

        const current = db.prepare('SELECT requester_name FROM sarpras_pengajuan WHERE id = ?').get(id) as { requester_name: string } | undefined;
        if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        db.prepare('UPDATE sarpras_pengajuan SET status = ?, rejection_reason = ?, updated_at = datetime("now","localtime") WHERE id = ?')
            .run(status, status === 'ditolak' ? (rejection_reason || null) : null, id);

        logAudit('update_status', 'sarpras_pengajuan', id, current.requester_name, `Status: ${status}`);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// DELETE /api/sarpras/pengajuan/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const p = await params;
        const db = getDb();
        const id = parseInt(p.id);

        const current = db.prepare('SELECT requester_name FROM sarpras_pengajuan WHERE id = ?').get(id) as { requester_name: string } | undefined;
        if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        db.prepare('DELETE FROM sarpras_pengajuan WHERE id = ?').run(id);

        logAudit('delete', 'sarpras_pengajuan', id, current.requester_name);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
