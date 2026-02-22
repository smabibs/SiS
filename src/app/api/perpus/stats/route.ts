import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const totalBooks = db.prepare('SELECT COUNT(*) as c FROM perpus_books').get() as { c: number };
    const totalMembers = db.prepare('SELECT COUNT(*) as c FROM perpus_members WHERE status = \'aktif\'').get() as { c: number };
    const activeLoans = db.prepare('SELECT COUNT(*) as c FROM perpus_loans WHERE status = \'dipinjam\'').get() as { c: number };
    const overdueLoans = db.prepare(`
      SELECT COUNT(*) as c FROM perpus_loans 
      WHERE status = 'dipinjam' AND date(due_date) < date('now')
    `).get() as { c: number };
    const totalFines = db.prepare(`
      SELECT SUM(fine) as total FROM perpus_loans WHERE fine > 0
    `).get() as { total: number | null };

    const recentLoans = db.prepare(`
      SELECT l.*, b.title as book_title, m.name as member_name, m.member_id as member_code, m.class as member_class,
        CASE 
          WHEN l.status = 'dipinjam' AND date(l.due_date) < date('now') THEN 'terlambat'
          ELSE l.status 
        END as computed_status
      FROM perpus_loans l
      JOIN perpus_books b ON l.book_id = b.id
      JOIN perpus_members m ON l.member_id = m.id
      ORDER BY l.created_at DESC
      LIMIT 8
    `).all();

    const overdueList = db.prepare(`
      SELECT l.*, b.title as book_title, b.isbn as book_isbn, m.name as member_name, m.member_id as member_code, m.class as member_class,
        CAST((julianday('now') - julianday(l.due_date)) AS INTEGER) as days_overdue,
        CAST((julianday('now') - julianday(l.due_date)) * 1000 AS INTEGER) as total_fine
      FROM perpus_loans l
      JOIN perpus_books b ON l.book_id = b.id
      JOIN perpus_members m ON l.member_id = m.id
      WHERE l.status = 'dipinjam' AND date(l.due_date) < date('now')
      ORDER BY l.due_date ASC
      LIMIT 10
    `).all();

    const booksBySubject = db.prepare(`
      SELECT s.name, s.color, COUNT(b.id) as total, SUM(b.total_copies) as total_copies
      FROM perpus_subjects s
      LEFT JOIN perpus_books b ON b.subject_id = s.id
      GROUP BY s.id
      ORDER BY total_copies DESC
      LIMIT 10
    `).all();

    const popularBooks = db.prepare(`
      SELECT b.id, b.title, b.author, b.isbn, COUNT(l.id) as loan_count
      FROM perpus_books b
      LEFT JOIN perpus_loans l ON l.book_id = b.id
      GROUP BY b.id
      ORDER BY loan_count DESC
      LIMIT 5
    `).all();

    const loansByMonth = db.prepare(`
      SELECT strftime('%Y-%m', loan_date) as month, COUNT(*) as count
      FROM perpus_loans
      WHERE loan_date >= datetime('now', '-6 months')
      GROUP BY month
      ORDER BY month ASC
    `).all();

    const topBorrowers = db.prepare(`
      SELECT m.id, m.name, m.member_id as member_code, m.class, m.type,
        COUNT(l.id) as loan_count,
        SUM(CASE WHEN l.status = 'dipinjam' THEN 1 ELSE 0 END) as active_count
      FROM perpus_members m
      JOIN perpus_loans l ON l.member_id = m.id
      GROUP BY m.id
      ORDER BY loan_count DESC
      LIMIT 5
    `).all();

    const categoryDistribution = db.prepare(`
      SELECT c.name, COUNT(b.id) as total, SUM(b.total_copies) as total_copies
      FROM perpus_categories c
      LEFT JOIN perpus_books b ON b.category_id = c.id
      GROUP BY c.id
      ORDER BY total_copies DESC
    `).all();

    const recentReturns = db.prepare(`
      SELECT l.id, l.return_date, l.fine, b.title as book_title, m.name as member_name
      FROM perpus_loans l
      JOIN perpus_books b ON l.book_id = b.id
      JOIN perpus_members m ON l.member_id = m.id
      WHERE l.status = 'dikembalikan'
      ORDER BY l.return_date DESC
      LIMIT 5
    `).all();

    const totalCopies = db.prepare('SELECT SUM(total_copies) as total, SUM(available_copies) as available FROM perpus_books').get() as { total: number | null; available: number | null };

    return NextResponse.json({
      totalBooks: totalBooks.c,
      totalMembers: totalMembers.c,
      activeLoans: activeLoans.c,
      overdueLoans: overdueLoans.c,
      totalFines: totalFines.total || 0,
      totalCopies: totalCopies.total || 0,
      availableCopies: totalCopies.available || 0,
      recentLoans,
      overdueList,
      booksBySubject,
      popularBooks,
      loansByMonth,
      topBorrowers,
      categoryDistribution,
      recentReturns,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
