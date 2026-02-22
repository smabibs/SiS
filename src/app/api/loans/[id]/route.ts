import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/loans/:id
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id);
        if (!loan) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        const items = db.prepare(`
            SELECT li.*, i.name as item_name, i.code as item_code, i.unit
            FROM loan_items li
            JOIN items i ON i.id = li.item_id
            WHERE li.loan_id = ?
        `).all(id);

        return NextResponse.json({ ...(loan as object), items });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// PUT /api/loans/:id — process return
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const body = await req.json();
        const { action, return_items, notes } = body;

        if (action === 'return') {
            const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(id) as { borrower_name: string; status: string } | undefined;
            if (!loan) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

            const updateLoanItem = db.prepare('UPDATE loan_items SET returned_quantity = ?, condition_after = ? WHERE id = ?');
            const updateStock = db.prepare('UPDATE items SET quantity = quantity + ? WHERE id = ?');
            const insertMutation = db.prepare(`
                INSERT INTO stock_mutations (item_id, type, quantity, reference, notes)
                VALUES (?, 'masuk', ?, ?, ?)
            `);

            const transaction = db.transaction(() => {
                for (const ri of return_items as { loan_item_id: number; returned_quantity: number; condition_after: string; item_id: number }[]) {
                    updateLoanItem.run(ri.returned_quantity, ri.condition_after || 'baik', ri.loan_item_id);
                    updateStock.run(ri.returned_quantity, ri.item_id);
                    insertMutation.run(ri.item_id, ri.returned_quantity, `return:${id}`, `Pengembalian: ${loan.borrower_name}`);

                    // Update item condition if damaged
                    if (ri.condition_after && ri.condition_after !== 'baik') {
                        // Just log it, don't change the overall item condition
                        logAudit('condition_change', 'item', ri.item_id, '', `Kondisi setelah pengembalian: ${ri.condition_after}`);
                    }
                }

                db.prepare(`UPDATE loans SET status = 'dikembalikan', return_date = date('now','localtime'), notes = ? WHERE id = ?`).run(notes || null, id);
                logAudit('return', 'loan', id, loan.borrower_name);
            });

            transaction();
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Action tidak valid' }, { status: 400 });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// DELETE /api/loans/:id
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const db = getDb();
        const loan = db.prepare('SELECT borrower_name FROM loans WHERE id = ?').get(id) as { borrower_name: string } | undefined;
        if (!loan) return NextResponse.json({ error: 'Tidak ditemukan' }, { status: 404 });

        // Return stock for unreturned items
        const loanItems = db.prepare('SELECT item_id, quantity, returned_quantity FROM loan_items WHERE loan_id = ?').all(id) as { item_id: number; quantity: number; returned_quantity: number }[];
        for (const li of loanItems) {
            const unreturned = li.quantity - li.returned_quantity;
            if (unreturned > 0) {
                db.prepare('UPDATE items SET quantity = quantity + ? WHERE id = ?').run(unreturned, li.item_id);
            }
        }

        db.prepare('DELETE FROM loans WHERE id = ?').run(id);
        logAudit('delete', 'loan', id, loan.borrower_name);

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
