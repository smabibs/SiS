'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, X, Building2 } from 'lucide-react';

interface Ruangan {
    id: number;
    code: string;
    name: string;
    type: string;
    capacity: number;
    location: string;
    condition: string;
    notes: string;
}

export default function SarprasRuangan() {
    const [rooms, setRooms] = useState<Ruangan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Ruangan>>({});
    const [saving, setSaving] = useState(false);

    const fetchRooms = async () => {
        setLoading(true);
        const res = await fetch(`/api/sarpras/ruangan?search=${search}`);
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
        setLoading(false);
    };

    useEffect(() => {
        fetchRooms();
    }, [search]);

    const handleSave = async () => {
        if (!editForm.name || !editForm.type) return alert('Nama & Tipe wajib diisi');
        setSaving(true);
        const method = isEditing ? 'PUT' : 'POST';
        const res = await fetch('/api/sarpras/ruangan', {
            method, headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editForm),
        });
        setSaving(false);
        if (res.ok) {
            setModalOpen(false);
            fetchRooms();
        } else {
            const data = await res.json();
            alert(data.error || 'Terjadi kesalahan');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Hapus ruangan ini?')) return;
        const res = await fetch(`/api/sarpras/ruangan?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchRooms();
        } else {
            const data = await res.json();
            alert(data.error || 'Gagal menghapus');
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
                    <h1>Manajemen Ruangan & Gedung</h1>
                    <p>Kelola data ruangan, laboratorium, dan gedung sekolah</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setIsEditing(false); setEditForm({}); setModalOpen(true); }}>
                    <Plus size={16} /> Tambah Ruangan
                </button>
            </div>

            <div className="toolbar">
                <div className="search-bar">
                    <Search size={15} />
                    <input
                        className="form-input"
                        placeholder="Cari kode, nama, atau tipe..."
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
                            <th>NAMA RUANGAN</th>
                            <th>TIPE</th>
                            <th>KAPASITAS</th>
                            <th>LOKASI</th>
                            <th>KONDISI</th>
                            <th>AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className="loading-overlay"><div className="spinner"></div></div></td></tr>
                        ) : rooms.length === 0 ? (
                            <tr><td colSpan={7}>
                                <div className="empty-state">
                                    <Building2 size={40} />
                                    <h3>Tidak ada data ruangan</h3>
                                    <p>Tambahkan ruangan baru untuk memulai</p>
                                </div>
                            </td></tr>
                        ) : rooms.map(room => (
                            <tr key={room.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>{room.code || '-'}</td>
                                <td style={{ fontWeight: 600 }}>{room.name}</td>
                                <td>{room.type}</td>
                                <td>{room.capacity} orang</td>
                                <td>{room.location || '-'}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                        background: `${conditionColor(room.condition)}15`,
                                        color: conditionColor(room.condition)
                                    }}>
                                        {room.condition.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-icon btn" onClick={() => { setIsEditing(true); setEditForm(room); setModalOpen(true); }}><Edit size={14} /></button>
                                        <button className="btn-icon btn" onClick={() => handleDelete(room.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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
                            <h2>{isEditing ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}</h2>
                            <button className="btn-icon btn" onClick={() => setModalOpen(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kode (Opsional)</label>
                                    <input className="form-input" value={editForm.code || ''} onChange={e => setEditForm(p => ({ ...p, code: e.target.value }))} placeholder="R.A-01" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama Ruangan</label>
                                    <input className="form-input" value={editForm.name || ''} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Laboratorium Biologi" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Tipe Ruangan</label>
                                    <select className="form-select" value={editForm.type || ''} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="">-- Pilih Tipe --</option>
                                        <option value="Kelas">Kelas</option>
                                        <option value="Laboratorium">Laboratorium</option>
                                        <option value="Perpustakaan">Perpustakaan</option>
                                        <option value="Kantor/Ruang Guru">Kantor/Ruang Guru</option>
                                        <option value="Lainnya">Lainnya</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kapasitas (Orang)</label>
                                    <input type="number" className="form-input" value={editForm.capacity || ''} onChange={e => setEditForm(p => ({ ...p, capacity: parseInt(e.target.value) || 0 }))} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Lokasi / Gedung</label>
                                    <input className="form-input" value={editForm.location || ''} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))} placeholder="Lantai 2 Gedung Timur" />
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
                                <label className="form-label">Catatan Tambahan</label>
                                <textarea className="form-textarea" value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Ruangan'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
