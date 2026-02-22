'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Plus, Trash2, Building2, Microscope, Tag } from 'lucide-react';

interface Category { id: number; name: string; type: string; description: string; }

export default function PengaturanPage() {
    const [tab, setTab] = useState<'sekolah' | 'lab' | 'kategori'>('sekolah');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [newCat, setNewCat] = useState({ name: '', type: 'alat', description: '' });

    const showToast = (msg: string, type: string) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data || {});
        setLoading(false);
    }, []);

    const fetchCategories = useCallback(async () => {
        const res = await fetch('/api/categories');
        setCategories(await res.json());
    }, []);

    useEffect(() => { fetchSettings(); fetchCategories(); }, [fetchSettings, fetchCategories]);

    const saveSettings = async () => {
        setSaving(true);
        const res = await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
        if (res.ok) showToast('Pengaturan disimpan', 'success');
        else showToast('Gagal menyimpan', 'error');
        setSaving(false);
    };

    const addCategory = async () => {
        if (!newCat.name) { showToast('Nama kategori wajib', 'error'); return; }
        const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newCat) });
        if (res.ok) { showToast('Kategori ditambahkan', 'success'); setNewCat({ name: '', type: 'alat', description: '' }); fetchCategories(); }
    };

    const deleteCategory = async (cat: Category) => {
        if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
        const res = await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: cat.id }) });
        if (res.ok) { showToast('Kategori dihapus', 'success'); fetchCategories(); }
    };

    const updateField = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    return (
        <>
            <div className="page-header">
                <div><h1>Pengaturan</h1><p>Konfigurasi informasi sekolah, laboratorium, dan kategori</p></div>
            </div>

            <div className="tabs" style={{ display: 'inline-flex', marginBottom: 20 }}>
                <button className={`tab ${tab === 'sekolah' ? 'active' : ''}`} onClick={() => setTab('sekolah')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} /> Sekolah</span>
                </button>
                <button className={`tab ${tab === 'lab' ? 'active' : ''}`} onClick={() => setTab('lab')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Microscope size={14} /> Laboratorium</span>
                </button>
                <button className={`tab ${tab === 'kategori' ? 'active' : ''}`} onClick={() => setTab('kategori')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={14} /> Kategori</span>
                </button>
            </div>

            {/* Sekolah */}
            {tab === 'sekolah' && (
                <div className="card">
                    <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Informasi Sekolah</h3>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Nama Sekolah</label>
                            <input className="form-input" value={settings.school_name || ''} onChange={e => updateField('school_name', e.target.value)} placeholder="SMP Negeri 1..." /></div>
                        <div className="form-group"><label className="form-label">NPSN</label>
                            <input className="form-input" value={settings.school_npsn || ''} onChange={e => updateField('school_npsn', e.target.value)} placeholder="20123456" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Alamat Sekolah</label>
                        <textarea className="form-textarea" value={settings.school_address || ''} onChange={e => updateField('school_address', e.target.value)} placeholder="Jl. Pendidikan No. 1..." rows={2} /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Nama Kepala Sekolah</label>
                            <input className="form-input" value={settings.principal_name || ''} onChange={e => updateField('principal_name', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">NIP Kepala Sekolah</label>
                            <input className="form-input" value={settings.principal_nip || ''} onChange={e => updateField('principal_nip', e.target.value)} /></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={saveSettings} disabled={saving}><Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </div>
            )}

            {/* Lab */}
            {tab === 'lab' && (
                <div className="card">
                    <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Informasi Laboratorium</h3>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Nama Laboratorium</label>
                            <input className="form-input" value={settings.lab_name || ''} onChange={e => updateField('lab_name', e.target.value)} placeholder="Laboratorium IPA" /></div>
                        <div className="form-group"><label className="form-label">Kepala Laboratorium</label>
                            <input className="form-input" value={settings.lab_head || ''} onChange={e => updateField('lab_head', e.target.value)} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">NIP Kepala Lab</label>
                            <input className="form-input" value={settings.lab_head_nip || ''} onChange={e => updateField('lab_head_nip', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Lokasi Lab</label>
                            <input className="form-input" value={settings.lab_location || ''} onChange={e => updateField('lab_location', e.target.value)} placeholder="Gedung B, Lt. 2" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Deskripsi</label>
                        <textarea className="form-textarea" value={settings.lab_description || ''} onChange={e => updateField('lab_description', e.target.value)} rows={3} /></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={saveSettings} disabled={saving}><Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </div>
            )}

            {/* Kategori */}
            {tab === 'kategori' && (
                <>
                    <div className="card" style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Tambah Kategori</h3>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
                            <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                <label className="form-label">Nama</label>
                                <input className="form-input" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="Nama kategori" />
                            </div>
                            <div className="form-group" style={{ width: 130, margin: 0 }}>
                                <label className="form-label">Tipe</label>
                                <select className="form-select" value={newCat.type} onChange={e => setNewCat({ ...newCat, type: e.target.value })}>
                                    <option value="alat">Alat</option>
                                    <option value="bahan">Bahan</option>
                                </select>
                            </div>
                            <button className="btn btn-primary" onClick={addCategory}><Plus size={14} /> Tambah</button>
                        </div>
                    </div>

                    <div className="card">
                        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Daftar Kategori</h3>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Nama</th><th>Tipe</th><th>Deskripsi</th><th style={{ width: 60 }}>Aksi</th></tr></thead>
                                <tbody>
                                    {categories.length === 0 ? (
                                        <tr><td colSpan={4}><div className="empty-state"><Tag size={30} /><h3>Belum ada kategori</h3></div></td></tr>
                                    ) : categories.map(cat => (
                                        <tr key={cat.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
                                            <td><span className={`badge ${cat.type === 'alat' ? 'badge-teal' : 'badge-purple'}`}>{cat.type}</span></td>
                                            <td>{cat.description || '-'}</td>
                                            <td><button className="btn-icon" onClick={() => deleteCategory(cat)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
        </>
    );
}
