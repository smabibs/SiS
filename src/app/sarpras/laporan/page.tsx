'use client';

import { useState } from 'react';
import { Download, Building2, Package, ClipboardList, PackagePlus, FileBarChart2 } from 'lucide-react';

export default function LaporanSarpras() {
    const [downloading, setDownloading] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const handleDownload = async (type: string, useGlobalExport: boolean = false, useDate: boolean = false) => {
        setDownloading(type);
        try {
            let urlStr = useGlobalExport ? `/api/export?type=${type}` : `/api/sarpras/export?type=${type}`;
            if (useDate) {
                const params = new URLSearchParams();
                if (dateFrom) params.set('from', dateFrom);
                if (dateTo) params.set('to', dateTo);
                const query = params.toString();
                if (query) {
                    urlStr += (urlStr.includes('?') ? '&' : '?') + query;
                }
            }

            const res = await fetch(urlStr);
            if (!res.ok) throw new Error('Gagal mengunduh laporan');

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_Sarpras_${type}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat mengunduh laporan.');
        } finally {
            setDownloading(null);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Laporan Sarana Prasarana</h1>
                    <p>Unduh rekap data inventaris, ruangan, riwayat peminjaman, dan pengajuan</p>
                </div>
            </div>

            {/* Date Range Filter */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <FileBarChart2 size={16} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Filter Tanggal (untuk laporan pengajuan)</h3>
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20,
                marginTop: 20
            }}>
                {/* Laporan Ruangan */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Data Ruangan & Gedung</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Export Excel</p>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
                        Laporan berisi daftar kode, nama, tipe kelas/lab, kapasitas kapasitas, serta lokasi spesifik setiap ruangan.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ justifyContent: 'center', width: '100%', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6' }}
                        disabled={downloading === 'ruangan'}
                        onClick={() => handleDownload('ruangan')}
                    >
                        {downloading === 'ruangan' ? 'Menyiapkan...' : <><Download size={15} /> Unduh Laporan (.xlsx)</>}
                    </button>
                </div>

                {/* Laporan Barang */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(139,92,246,0.1)', color: '#8B5CF6',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Data Barang Inventaris</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Export Excel</p>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
                        Rekapitulasi lengkap barang berdasarkan kategori, stok/kuantitas, kondisi, dan ruangan penempatan.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ justifyContent: 'center', width: '100%', border: '1px solid rgba(139,92,246,0.3)', color: '#8B5CF6' }}
                        disabled={downloading === 'barang'}
                        onClick={() => handleDownload('barang')}
                    >
                        {downloading === 'barang' ? 'Menyiapkan...' : <><Download size={15} /> Unduh Laporan (.xlsx)</>}
                    </button>
                </div>

                {/* Laporan Peminjaman */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(16,185,129,0.1)', color: '#10B981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ClipboardList size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Riwayat Peminjaman</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Export Excel</p>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
                        Catatan peminjaman ruang maupun barang, termasuk informasi peminjam, tanggal, dan status penyelesaian.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ justifyContent: 'center', width: '100%', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}
                        disabled={downloading === 'peminjaman'}
                        onClick={() => handleDownload('peminjaman')}
                    >
                        {downloading === 'peminjaman' ? 'Menyiapkan...' : <><Download size={15} /> Unduh Laporan (.xlsx)</>}
                    </button>
                </div>

                {/* Laporan Pengajuan */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 12,
                            background: 'rgba(234,88,12,0.1)', color: '#EA580C',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <PackagePlus size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Riwayat Pengajuan</h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Export Excel</p>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', flex: 1 }}>
                        Catatan pengajuan inventaris sarana dan prasarana beserta status dan item yang diajukan.
                    </p>
                    <button
                        className="btn btn-secondary"
                        style={{ justifyContent: 'center', width: '100%', border: '1px solid rgba(234,88,12,0.3)', color: '#EA580C' }}
                        disabled={downloading === 'sarpras-pengajuan'}
                        onClick={() => handleDownload('sarpras-pengajuan', true, true)}
                    >
                        {downloading === 'sarpras-pengajuan' ? 'Menyiapkan...' : <><Download size={15} /> Unduh Laporan (.xlsx)</>}
                    </button>
                </div>

            </div>
        </div>
    );
}
