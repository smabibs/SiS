import { NextRequest, NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/loans
export async function GET(req: NextRequest) {
    try {
        const db = getDb();
        const url = new URL(req.url);
        const status = url.searchParams.get('status') || '';
        const search = url.searchParams.get('search') || '';
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = '1=1';
        const params: (string | number)[] = [];

        if (status) {
            where += ' AND l.status = ?';
            params.push(status);
        }
        if (search) {
            where += ' AND (l.borrower_name LIKE ? OR l.purpose LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Auto-update overdue loans
        db.prepare(`UPDATE loans SET status = 'terlambat' WHERE status = 'dipinjam' AND due_date < date('now','localtime')`).run();

        const countRow = db.prepare(`SELECT COUNT(*) as c FROM loans l WHERE ${where}`).get(...params) as { c: number };

        const loans = db.prepare(`
            SELECT l.*,
            (SELECT GROUP_CONCAT(i.name, ', ') FROM loan_items li JOIN items i ON i.id = li.item_id WHERE li.loan_id = l.id) as item_names,
            (SELECT SUM(li.quantity) FROM loan_items li WHERE li.loan_id = l.id) as total_items
            FROM loans l
            WHERE ${where}
            ORDER BY CASE l.status WHEN 'terlambat' THEN 0 WHEN 'dipinjam' THEN 1 ELSE 2 END, l.created_at DESC
            LIMIT ? OFFSET ?
        `).all(...params, limit, offset);

        return NextResponse.json({
            loans,
            total: countRow.c,
            page,
            totalPages: Math.ceil(countRow.c / limit),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}

// POST /api/loans — create new loan
export async function POST(req: NextRequest) {
    try {
        const db = getDb();
        const body = await req.json();
        const { borrower_name, borrower_class, purpose, subject, loan_date, due_date, notes, items } = body;

        if (!borrower_name || !items || items.length === 0) {
            return NextResponse.json({ error: 'Peminjam dan item wajib diisi' }, { status: 400 });
        }

        const insertLoan = db.prepare(`
            INSERT INTO loans (borrower_name, borrower_class, purpose, subject, loan_date, due_date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const insertLoanItem = db.prepare(`
            INSERT INTO loan_items (loan_id, item_id, quantity, condition_before)
            VALUES (?, ?, ?, ?)
        `);
        const updateStock = db.prepare('UPDATE items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?');
        const insertMutation = db.prepare(`
            INSERT INTO stock_mutations (item_id, type, quantity, reference, notes)
            VALUES (?, 'keluar', ?, ?, ?)
        `);

        const transaction = db.transaction(() => {
            const result = insertLoan.run(
                borrower_name, borrower_class || null, purpose || null, subject || null,
                loan_date || new Date().toISOString().split('T')[0],
                due_date || null, notes || null
            );
            const loanId = result.lastInsertRowid;

            for (const item of items as { item_id: number; quantity: number; condition_before?: string }[]) {
                // Check stock
                const currentItem = db.prepare('SELECT quantity, name FROM items WHERE id = ?').get(item.item_id) as { quantity: number; name: string } | undefined;
                if (!currentItem || currentItem.quantity < item.quantity) {
                    throw new Error(`Stok ${currentItem?.name || 'item'} tidak mencukupi`);
                }
                insertLoanItem.run(loanId, item.item_id, item.quantity, item.condition_before || 'baik');
                updateStock.run(item.quantity, item.item_id, item.quantity);
                insertMutation.run(item.item_id, item.quantity, `loan:${loanId}`, `Peminjaman: ${borrower_name}`);
            }

            logAudit('create', 'loan', loanId, borrower_name, `${items.length} jenis item`);
            return loanId;
        });

        const loanId = transaction();
        return NextResponse.json({ id: loanId, success: true });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
