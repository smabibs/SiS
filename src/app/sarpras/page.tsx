'use client';

import { useEffect, useState } from 'react';
import { Package, Building2, ClipboardList, AlertTriangle } from 'lucide-react';

interface SarprasStats {
    totalRuangan: number;
    totalBarang: number;
    barangRusak: number;
}

export default function SarprasDashboardPage() {
    const [stats, setStats] = useState<SarprasStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/sarpras/stats')
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
                    <h1>Dashboard Sarpras</h1>
                    <p>Ringkasan informasi Sarana dan Prasarana Sekolah</p>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(124,58,237,0.15)' }}>
                        <Building2 size={22} style={{ color: '#8B5CF6' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalRuangan || 0}</h3>
                        <p>Total Ruangan</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                        <Package size={22} style={{ color: '#3B82F6' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.totalBarang || 0}</h3>
                        <p>Total Barang</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>
                        <AlertTriangle size={22} style={{ color: '#EF4444' }} />
                    </div>
                    <div className="stat-info">
                        <h3>{stats?.barangRusak || 0}</h3>
                        <p>Barang Rusak</p>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 24 }} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <ClipboardList size={16} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Aktivitas Terbaru</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Belum ada aktivitas Sarpras yang tercatat.</p>
            </div>
        </>
    );
}
