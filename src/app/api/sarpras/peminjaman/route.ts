import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = 'SELECT * FROM sarpras_peminjaman';
        const params: (string | number)[] = [];

        if (search) {
            query += ' WHERE borrower_name LIKE ? OR purpose LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC LIMIT ?';
        params.push(limit);

        const loans = db.prepare(query).all(...params) as any[];

        // Fetch items for each loan
        const stmtItems = db.prepare(`
            SELECT pi.*, r.name as ruangan_name, b.name as barang_name 
            FROM sarpras_peminjaman_items pi
            LEFT JOIN sarpras_ruangan r ON pi.ruangan_id = r.id
            LEFT JOIN sarpras_barang b ON pi.barang_id = b.id
            WHERE pi.loan_id = ?
        `);

        for (const loan of loans) {
            loan.items = stmtItems.all(loan.id);
        }

        return NextResponse.json(loans);
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { borrower_name, purpose, location, borrow_date, return_date, notes, items } = body;

        if (!borrower_name) return NextResponse.json({ error: 'Nama Peminjam wajib diisi' }, { status: 400 });
        if (!items || !items.length) return NextResponse.json({ error: 'Minimal pilih 1 ruangan atau barang' }, { status: 400 });

        const createLoan = db.transaction(() => {
            const result = db.prepare(`
                INSERT INTO sarpras_peminjaman (borrower_name, purpose, location, borrow_date, return_date, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(borrower_name, purpose || null, location || null, borrow_date || null, return_date || null, notes || null);

            const loanId = result.lastInsertRowid;
            const insertItem = db.prepare(`
                INSERT INTO sarpras_peminjaman_items (loan_id, item_type, ruangan_id, barang_id, quantity, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            for (const item of items) {
                insertItem.run(loanId, item.item_type, item.ruangan_id || null, item.barang_id || null, item.quantity || 1, item.notes || null);
            }
            return loanId;
        });

        const newId = createLoan();
        const newLoan = db.prepare('SELECT * FROM sarpras_peminjaman WHERE id = ?').get(newId);
        logAudit('CREATE', 'sarpras_peminjaman', newId, borrower_name);
        return NextResponse.json(newLoan, { status: 201 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) return NextResponse.json({ error: 'ID dan status wajib diisi' }, { status: 400 });

        const actualReturnDate = status === 'dikembalikan' ? new Date().toISOString().split('T')[0] : null;

        db.prepare(`
            UPDATE sarpras_peminjaman 
            SET status=?, actual_return_date=?
            WHERE id=?
        `).run(status, actualReturnDate, id);

        const updatedLoan = db.prepare('SELECT * FROM sarpras_peminjaman WHERE id = ?').get(id);
        logAudit('UPDATE', 'sarpras_peminjaman', id, 'Status: ' + status);
        return NextResponse.json(updatedLoan);
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

        db.transaction(() => {
            db.prepare('DELETE FROM sarpras_peminjaman_items WHERE loan_id = ?').run(id);
            db.prepare('DELETE FROM sarpras_peminjaman WHERE id = ?').run(id);
        })();

        logAudit('DELETE', 'sarpras_peminjaman', id, 'Peminjaman ID ' + id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
