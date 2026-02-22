'use client';

import { useEffect, useState } from 'react';
import { Microscope, FlaskConical, ClipboardList, PackagePlus, AlertTriangle, Clock } from 'lucide-react';

interface Stats {
    totalAlat: number;
    totalBahan: number;
    activeLoans: number;
    pendingRequests: number;
    overdueLoans: number;
    lowStock: number;
    recentLoans: { id: number; borrower_name: string; borrower_class: string; status: string; loan_date: string; item_names: string }[];
    lowStockItems: { id: number; code: string; name: string; type: string; quantity: number; min_stock: number; unit: string }[];
}

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/stats')
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-overlay"><div className="spinner" /></div>;
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Ringkasan informasi Laboratorium IPA</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(13,148,136,0.15)' }}>
                        <Microscope size={22} style={{ color: '#0D9488' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalAlat || 0}</h3>
                        <p>Total Alat</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>
                        <FlaskConical size={22} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalBahan || 0}</h3>
                        <p>Total Bahan</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                        <ClipboardList size={22} style={{ color: '#3B82F6' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.activeLoans || 0}</h3>
                        <p>Peminjaman Aktif</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
                        <PackagePlus size={22} style={{ color: '#F59E0B' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.pendingRequests || 0}</h3>
                        <p>Pengajuan Pending</p>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {(stats?.overdueLoans || 0) > 0 && (
                <div style={{
                    background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: 12, padding: '14px 20px', marginBottom: 20,
                    display: 'flex', alignItems: 'center', gap: 12, color: '#EF4444', fontSize: 14,
                }}>
                    <AlertTriangle size={18} />
                    <span><strong>{stats?.overdueLoans}</strong> peminjaman melewati batas waktu pengembalian</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Recent Loans */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Clock size={16} style={{ color: 'var(--accent)' }} />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Peminjaman Terbaru</h3>
                    </div>
                    {stats?.recentLoans && stats.recentLoans.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.recentLoans.map(loan => (
                                <div key={loan.id} style={{
                                    padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                            {loan.borrower_name}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {loan.item_names ? (loan.item_names.length > 40 ? loan.item_names.slice(0, 40) + '…' : loan.item_names) : '-'}
                                        </div>
                                    </div>
                                    <span className={`badge ${loan.status === 'terlambat' ? 'badge-red' : loan.status === 'dipinjam' ? 'badge-blue' : 'badge-green'}`}>
                                        {loan.status === 'dipinjam' ? 'Dipinjam' : loan.status === 'terlambat' ? 'Terlambat' : 'Kembali'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada peminjaman</p>
                    )}
                </div>

                {/* Low Stock */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <AlertTriangle size={16} style={{ color: '#F59E0B' }} />
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Stok Menipis</h3>
                    </div>
                    {stats?.lowStockItems && stats.lowStockItems.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {stats.lowStockItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '10px 14px', background: 'var(--bg-tertiary)', borderRadius: 8,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                                            {item.name}
                                        </div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                            {item.code}
                                        </div>
                                    </div>
                                    <span className={`badge ${item.quantity === 0 ? 'badge-red' : 'badge-yellow'}`}>
                                        {item.quantity} / {item.min_stock} {item.unit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Semua stok aman ✓</p>
                    )}
                </div>
            </div>
        </>
    );
}
