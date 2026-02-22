'use client';

import { useState } from 'react';
import { Download, FileBarChart2, Microscope, FlaskConical, ClipboardList, PackagePlus } from 'lucide-react';

interface ReportType {
    id: string; label: string; desc: string; icon: React.ReactNode; useDateRange: boolean;
}

const reports: ReportType[] = [
    { id: 'inventaris-alat', label: 'Inventaris Alat', desc: 'Daftar lengkap alat laboratorium beserta kondisi dan lokasi', icon: <Microscope size={24} />, useDateRange: false },
    { id: 'inventaris-bahan', label: 'Inventaris Bahan', desc: 'Daftar lengkap bahan laboratorium beserta stok dan harga', icon: <FlaskConical size={24} />, useDateRange: false },
    { id: 'peminjaman', label: 'Laporan Peminjaman', desc: 'Riwayat peminjaman dan pengembalian alat/bahan', icon: <ClipboardList size={24} />, useDateRange: true },
    { id: 'pengajuan', label: 'Laporan Pengajuan', desc: 'Riwayat pengajuan kebutuhan alat/bahan baru', icon: <PackagePlus size={24} />, useDateRange: true },
];

export default function LaporanPage() {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [downloading, setDownloading] = useState('');

    const handleDownload = async (report: ReportType) => {
        setDownloading(report.id);
        const params = new URLSearchParams({ type: report.id });
        if (report.useDateRange && dateFrom) params.set('from', dateFrom);
        if (report.useDateRange && dateTo) params.set('to', dateTo);

        try {
            const res = await fetch(`/api/export?${params}`);
            if (!res.ok) throw new Error('Download gagal');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${report.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (e) {
            alert('Gagal mendownload: ' + String(e));
        }
        setDownloading('');
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Laporan</h1>
                    <p>Export laporan inventaris, peminjaman, dan pengajuan ke Excel</p>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <FileBarChart2 size={16} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Filter Tanggal (untuk laporan peminjaman & pengajuan)</h3>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>Dari</label>
                        <input className="form-input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: 12 }}>Sampai</label>
                        <input className="form-input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                    {(dateFrom || dateTo) && (
                        <button className="btn btn-sm btn-secondary" onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ alignSelf: 'end', marginBottom: 4 }}>
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Report Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {reports.map(report => (
                    <div key={report.id} className="card" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 28,
                        transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
                    }}
                        onClick={() => handleDownload(report)}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{
                            width: 56, height: 56, borderRadius: 14,
                            background: 'linear-gradient(135deg, rgba(13,148,136,0.15), rgba(16,185,129,0.15))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--accent)', marginBottom: 16,
                        }}>
                            {report.icon}
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {report.label}
                        </h3>
                        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            {report.desc}
                        </p>
                        <button
                            className="btn btn-primary"
                            disabled={downloading === report.id}
                            style={{ width: '100%' }}
                            onClick={e => { e.stopPropagation(); handleDownload(report); }}
                        >
                            <Download size={15} />
                            {downloading === report.id ? 'Mengunduh...' : 'Download Excel'}
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}
