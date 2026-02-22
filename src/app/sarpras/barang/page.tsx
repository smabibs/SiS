'use client';

import { useEffect, useState, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Package, Upload } from 'lucide-react';

interface Ruangan {
    id: number;
    name: string;
}

interface Barang {
    id: number;
    code: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    condition: string;
    room_id: number;
    room_name: string;
    price: number;
    notes: string;
}

export default function SarprasBarang() {
    const [items, setItems] = useState<Barang[]>([]);
    const [rooms, setRooms] = useState<Ruangan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Barang>>({});
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchItems = async () => {
        setLoading(true);
        const res = await fetch(`/api/sarpras/barang?search=${search}`);
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchItems();
    }, [search]);

    useEffect(() => {
        fetch('/api/sarpras/ruangan').then(r => r.json()).then(d => setRooms(Array.isArray(d) ? d : []));
    }, []);

    const handleSave = async () => {
        if (!editForm.name || !editForm.category) return alert('Nama & Kategori wajib diisi');
        setSaving(true);
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch('/api/sarpras/barang', {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setSaving(false);
        if (res.ok) {
            setModalOpen(false);
            fetchItems();
        } else {
            const data = await res.json();
            alert(data.error || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus barang ini?')) return;
        const res = await fetch(`/api/sarpras/barang?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchItems();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menghapus');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/sarpras/import', { method: 'POST', body: formData });
            const data = await res.json();
            if (res.ok) {
                let msg = data.message;
                if (data.errors && data.errors.length > 0) {
                    msg += '\n\nCatatan:\n' + data.errors.join('\n');
                }
                alert(msg);
                fetchItems();
            } else {
                alert(data.error || 'Gagal import');
            }
        } catch (err: any) {
            alert('Kesalahan server: ' + err.message);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const conditionColor = (kondisi: string) => {
        if (kondisi === 'rusak berat') return 'var(--danger)';
        if (kondisi === 'rusak ringan') return 'var(--warning)';
        return 'var(--success)';
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Barang Inventaris</h1>
                    <p>Kelola data barang inventaris sekolah berdasarkan ruangan</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImport}
                    />
                    <button
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        {importing ? 'Memproses...' : <><Upload size={16} /> Import Excel</>}
                    </button>
                    <button className="btn btn-primary" onClick={() => { setIsEditing(false); setEditForm({}); setModalOpen(true); }}>
                        <Plus size={16} /> Tambah Barang
                    </button>
                </div>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={15} />
                    <input
                        className="form-input"
                        placeholder="Cari kode, nama, atau kategori..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>KODE</th>
                            <th>NAMA BARANG</th>
                            <th>KATEGORI</th>
                            <th>JUMLAH</th>
                            <th>LOKASI RUANGAN</th>
                            <th>KONDISI</th>
                            <th>AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className="loading-overlay"><div className="spinner"></div></div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="empty-state">
                                    <Package size={40} />
                                    <h3>Tidak ada barang inventaris</h3>
                                    <p>Tambahkan barang baru ke dalam ruangan</p>
                                </div>
                            </td></tr>
                        ) : items.map(item => (
                            <tr key={item.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{item.code || '-'}</td>
                                <td style={{ fontWeight: 600 }}>{item.name}</td>
                                <td>{item.category}</td>
                                <td>{item.quantity} {item.unit}</td>
                                <td>{item.room_name || <span style={{ color: 'var(--text-muted)' }}>Belum ditempatkan</span>}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        background: `${conditionColor(item.condition)}15`,
                                        color: conditionColor(item.condition)
                                    }}>
                                        {item.condition.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-icon btn" onClick={() => { setIsEditing(true); setEditForm(item); setModalOpen(true); }}><Edit size={14} /></button>
                                        <button className="btn-icon btn" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
                    <div className="modal">
                        <div className="modal-header">
                            <h2>{isEditing ? 'Edit Barang' : 'Tambah Barang Baru'}</h2>
                            <button className="btn-icon btn" onClick={() => setModalOpen(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kode / No. Inventaris</label>
                                    <input className="form-input" value={editForm.code || ''} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} placeholder="INV.001" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama Barang</label>
                                    <input className="form-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Proyektor EPSON" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kategori</label>
                                    <select className="form-select" value={editForm.category || ''} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
                                        <option value="">-- Pilih Kategori --</option>
                                        <option value="Elektronik">Elektronik</option>
                                        <option value="Mebel/Furniture">Mebel / Furniture</option>
                                        <option value="Peralatan Kelas">Peralatan Kelas</option>
                                        <option value="Kendaraan">Kendaraan</option>
                                        <option value="Alat Olahraga">Alat Olahraga</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ display: 'flex', gap: 10 }}>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Jumlah</label>
                                        <input type="number" className="form-input" value={editForm.quantity || ''} onChange={e => setEditForm(p => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label className="form-label">Satuan</label>
                                        <input className="form-input" value={editForm.unit || 'pcs'} onChange={e => setEditForm(p => ({ ...p, unit: e.target.value }))} placeholder="unit, pcs..." />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Penempatan Ruangan</label>
                                    <select className="form-select" value={editForm.room_id || ''} onChange={e => setEditForm(p => ({ ...p, room_id: parseInt(e.target.value) || undefined }))}>
                                        <option value="">-- Belum Ditempatkan --</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kondisi</label>
                                    <select className="form-select" value={editForm.condition || 'baik'} onChange={e => setEditForm(p => ({ ...p, condition: e.target.value }))}>
                                        <option value="baik">Baik</option>
                                        <option value="rusak ringan">Rusak Ringan</option>
                                        <option value="rusak berat">Rusak Berat</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Catatan</label>
                                <textarea className="form-textarea" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Barang'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
