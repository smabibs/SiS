'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, CheckCircle, Trash2, X, ClipboardList, Clock } from 'lucide-react';

interface Ruangan { id: number; name: string; type: string; }
interface Barang { id: number; name: string; quantity: number; unit: string; }

interface PeminjamanItem {
    id: number;
    item_type: 'ruangan' | 'barang';
    ruangan_id?: number | null;
    barang_id?: number | null;
    ruangan_name?: string;
    barang_name?: string;
    quantity: number;
    notes?: string;
}

interface Peminjaman {
    id: number;
    borrower_name: string;
    purpose: string;
    location: string;
    borrow_date: string;
    return_date: string;
    actual_return_date: string | null;
    status: string;
    notes?: string;
    items?: PeminjamanItem[];
    created_at: string;
}

export default function SarprasPeminjaman() {
    const [loans, setLoans] = useState<Peminjaman[]>([]);
    const [rooms, setRooms] = useState<Ruangan[]>([]);
    const [itemsList, setItemsList] = useState<Barang[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [borrower_name, setBorrower_name] = useState('');
    const [purpose, setPurpose] = useState('');
    const [location, setLocation] = useState('');
    const [borrow_date, setBorrow_date] = useState(new Date().toISOString().split('T')[0]);
    const [return_date, setReturn_date] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedItems, setSelectedItems] = useState<Partial<PeminjamanItem>[]>([]);

    const fetchLoans = async () => {
        setLoading(true);
        const res = await fetch(`/api/sarpras/peminjaman?search=${search}`);
        const data = await res.json();
        setLoans(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchLoans();
        fetch('/api/sarpras/ruangan').then(r => r.json()).then(d => setRooms(Array.isArray(d) ? d : []));
        fetch('/api/sarpras/barang').then(r => r.json()).then(d => setItemsList(Array.isArray(d) ? d : []));
    }, [search]);

    const handleSave = async () => {
        if (!borrower_name) return alert('Nama peminjam wajib diisi');
        if (selectedItems.length === 0) return alert('Pilih minimal 1 ruangan atau barang');

        setSaving(true);
        const res = await fetch('/api/sarpras/peminjaman', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ borrower_name, purpose, location, borrow_date, return_date, notes, items: selectedItems }),
        });
        setSaving(false);
        if (res.ok) {
            setModalOpen(false);
            fetchLoans();
        } else {
            const data = await res.json();
            alert(data.error || 'Terjadi kesalahan');
        }
    };

    const handleReturn = async (id: number) => {
        if (!confirm('Tandai peminjaman ini telah dikembalikan?')) return;
        const res = await fetch(`/api/sarpras/peminjaman`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'dikembalikan' }),
        });
        if (res.ok) fetchLoans();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus log peminjaman ini? Data tidak dapat dikembalikan.')) return;
        const res = await fetch(`/api/sarpras/peminjaman?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchLoans();
    };

    const addItemSelection = (type: 'ruangan' | 'barang') => {
        setSelectedItems([...selectedItems, { item_type: type, quantity: 1 }]);
    };

    const updateItemSelection = (index: number, changes: Partial<PeminjamanItem>) => {
        const newItems = [...selectedItems];
        newItems[index] = { ...newItems[index], ...changes };
        setSelectedItems(newItems);
    };

    const removeItemSelection = (index: number) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const statusBadge = (status: string) => {
        if (status === 'dikembalikan') return <span className="badge badge-green">Selesai</span>;
        if (status === 'terlambat') return <span className="badge badge-red">Terlambat</span>;
        return <span className="badge badge-yellow">Dipinjam</span>;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Peminjaman Sarpras</h1>
                    <p>Catat dan pantau penggunaan ruangan atau peminjaman barang inventaris</p>
                </div>
                <button className="btn btn-primary" onClick={() => {
                    setBorrower_name(''); setPurpose(''); setLocation(''); setReturn_date(''); setNotes(''); setSelectedItems([]); setModalOpen(true);
                }}>
                    <Plus size={16} /> Buat Peminjaman
                </button>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={15} />
                    <input
                        className="form-input"
                        placeholder="Cari peminjam, kegiatan..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="loading-overlay" style={{ height: 300 }}><div className="spinner"></div></div>
            ) : loans.length === 0 ? (
                <div className="empty-state" style={{ marginTop: 20 }}>
                    <ClipboardList size={40} />
                    <h3>Tidak ada data peminjaman</h3>
                    <p>Mulai catat penggunaan fasilitas sekolah</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20, marginTop: 20 }}>
                    {loans.map(loan => (
                        <div key={loan.id} style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                            borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--text-primary)' }}>{loan.borrower_name}</h3>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <Clock size={13} /> {new Date(loan.borrow_date).toLocaleDateString('id-ID')}
                                        {loan.return_date && ` - ${new Date(loan.return_date).toLocaleDateString('id-ID')}`}
                                    </div>
                                </div>
                                {statusBadge(loan.status)}
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: 10, fontSize: 13 }}>
                                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>Fasilitas yg dipinjam:</div>
                                <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {loan.items?.map((item, i) => (
                                        <li key={i}>
                                            {item.item_type === 'ruangan'
                                                ? `Ruang: ${item.ruangan_name || '?'}`
                                                : `Barang: ${item.barang_name || '?'}` + (item.quantity > 1 ? ` (${item.quantity} unit)` : '')
                                            }
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {(loan.purpose || loan.location) && (
                                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                    {loan.purpose && <div><strong>Tujuan:</strong> {loan.purpose}</div>}
                                    {loan.location && <div><strong>Lokasi/Kelas:</strong> {loan.location}</div>}
                                </div>
                            )}

                            <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(loan.id)} style={{ color: 'var(--danger)' }}>
                                    <Trash2 size={14} /> Hapus
                                </button>
                                {loan.status !== 'dikembalikan' && (
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleReturn(loan.id)} style={{ color: 'var(--success)', borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
                                        <CheckCircle size={14} /> Tandai Selesai
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div className="modal" style={{ maxWidth: 640 }}>
                        <div className="modal-header">
                            <h2>Pinjam Fasilitas Sarpras</h2>
                            <button className="btn-icon btn" onClick={() => setModalOpen(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <div className="form-row">
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">Nama Peminjam / Guru / Penanggung Jawab *</label>
                                    <input className="form-input" value={borrower_name} onChange={e => setBorrower_name(e.target.value)} placeholder="Misal: Bp. Ahmad (Guru Fisika)" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tujuan Kegiatan</label>
                                    <input className="form-input" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Praktikum, Ekstrakurikuler, Rapat..." />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Lokasi / Kelas Asal</label>
                                    <input className="form-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="XI IPA 1, Lapangan..." />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tanggal Pelaksanaan (Mulai)</label>
                                    <input type="date" className="form-input" value={borrow_date} onChange={e => setBorrow_date(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tanggal Pengembalian (Rencana)</label>
                                    <input type="date" className="form-input" value={return_date} onChange={e => setReturn_date(e.target.value)} />
                                </div>
                            </div>

                            <div style={{ marginTop: 24, marginBottom: 12, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
                                <label className="form-label">Daftar Pinjaman (Fasilitas / Barang) *</label>
                                {selectedItems.map((sel, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                                        {sel.item_type === 'ruangan' ? (
                                            <select className="form-select" style={{ flex: 2 }} value={sel.ruangan_id || ''} onChange={e => updateItemSelection(idx, { ruangan_id: parseInt(e.target.value) })}>
                                                <option value="">-- Pilih Ruangan --</option>
                                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                                            </select>
                                        ) : (
                                            <select className="form-select" style={{ flex: 2 }} value={sel.barang_id || ''} onChange={e => updateItemSelection(idx, { barang_id: parseInt(e.target.value) })}>
                                                <option value="">-- Pilih Barang --</option>
                                                {itemsList.map(b => <option key={b.id} value={b.id}>{b.name} (Stok: {b.quantity} {b.unit})</option>)}
                                            </select>
                                        )}

                                        {sel.item_type === 'barang' && (
                                            <input type="number" className="form-input" style={{ width: 80 }} min={1} value={sel.quantity || 1} onChange={e => updateItemSelection(idx, { quantity: parseInt(e.target.value) || 1 })} />
                                        )}
                                        <button className="btn btn-secondary btn-sm" onClick={() => removeItemSelection(idx)}>Hapus</button>
                                    </div>
                                ))}

                                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addItemSelection('ruangan')}>+ Tambah Ruangan</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => addItemSelection('barang')}>+ Tambah Barang</button>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: 20 }}>
                                <label className="form-label">Catatan Tambahan</label>
                                <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Tambahkan keterangan kondisi saat dipinjam..."></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Peminjaman'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
