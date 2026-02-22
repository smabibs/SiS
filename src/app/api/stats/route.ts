import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const db = getDb();

        const totalAlat = db.prepare("SELECT COUNT(*) as c FROM items WHERE type='alat'").get() as { c: number };
        const totalBahan = db.prepare("SELECT COUNT(*) as c FROM items WHERE type='bahan'").get() as { c: number };
        const activeLoans = db.prepare("SELECT COUNT(*) as c FROM loans WHERE status IN ('dipinjam','terlambat')").get() as { c: number };
        const overdueLoans = db.prepare("SELECT COUNT(*) as c FROM loans WHERE status='terlambat'").get() as { c: number };
        const pendingRequests = db.prepare("SELECT COUNT(*) as c FROM requests WHERE status='pending'").get() as { c: number };
        const lowStock = db.prepare("SELECT COUNT(*) as c FROM items WHERE quantity <= min_stock AND min_stock > 0").get() as { c: number };

        // Recent activity
        const recentLoans = db.prepare(`
            SELECT l.*, GROUP_CONCAT(i.name, ', ') as item_names
            FROM loans l
            LEFT JOIN loan_items li ON li.loan_id = l.id
            LEFT JOIN items i ON i.id = li.item_id
            GROUP BY l.id
            ORDER BY l.created_at DESC LIMIT 5
        `).all();

        // Low stock items
        const lowStockItems = db.prepare(`
            SELECT id, code, name, type, quantity, min_stock, unit
            FROM items WHERE quantity <= min_stock AND min_stock > 0
            ORDER BY (quantity * 1.0 / max(min_stock, 1)) ASC
            LIMIT 10
        `).all();

        return NextResponse.json({
            totalAlat: totalAlat.c,
            totalBahan: totalBahan.c,
            activeLoans: activeLoans.c,
            overdueLoans: overdueLoans.c,
            pendingRequests: pendingRequests.c,
            lowStock: lowStock.c,
            recentLoans,
            lowStockItems,
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
