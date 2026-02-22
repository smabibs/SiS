'use client';

import { useEffect, useState, useCallback } from 'react';
import { Save, Building2, Package } from 'lucide-react';

export default function SarprasPengaturanPage() {
    const [tab, setTab] = useState<'sekolah' | 'sistem'>('sekolah');
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

    const showToast = (msg: string, type: string) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        const res = await fetch('/api/settings');
        const data = await res.json();
        setSettings(data || {});
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const saveSettings = async () => {
        setSaving(true);
        const res = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        if (res.ok) showToast('Pengaturan disimpan', 'success');
        else showToast('Gagal menyimpan', 'error');
        setSaving(false);
    };

    const updateField = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

    if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1>Pengaturan Sarpras</h1>
                    <p>Konfigurasi informasi sekolah dan sistem Sarana Prasarana</p>
                </div>
            </div>

            <div className="tabs" style={{ display: 'inline-flex', marginBottom: 20 }}>
                <button className={`tab ${tab === 'sekolah' ? 'active' : ''}`} onClick={() => setTab('sekolah')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} /> Profil Sekolah</span>
                </button>
                <button className={`tab ${tab === 'sistem' ? 'active' : ''}`} onClick={() => setTab('sistem')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Package size={14} /> Sistem Sarpras</span>
                </button>
            </div>

            {/* Sekolah */}
            {tab === 'sekolah' && (
                <div className="card">
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Informasi Umum Sekolah</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Sekolah</label>
                            <input className="form-input" value={settings.school_name || ''} onChange={e => updateField('school_name', e.target.value)} placeholder="SMA Negeri 1..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">NPSN</label>
                            <input className="form-input" value={settings.school_npsn || ''} onChange={e => updateField('school_npsn', e.target.value)} placeholder="20123456" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Alamat Sekolah</label>
                        <textarea className="form-textarea" value={settings.school_address || ''} onChange={e => updateField('school_address', e.target.value)} placeholder="Jl. Pendidikan No. 1..." rows={2} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Email Sekolah</label>
                            <input type="email" className="form-input" value={settings.school_email || ''} onChange={e => updateField('school_email', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Telepon</label>
                            <input className="form-input" value={settings.school_phone || ''} onChange={e => updateField('school_phone', e.target.value)} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nama Kepala Sekolah</label>
                            <input className="form-input" value={settings.principal_name || ''} onChange={e => updateField('principal_name', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">NIP Kepala Sekolah</label>
                            <input className="form-input" value={settings.principal_nip || ''} onChange={e => updateField('principal_nip', e.target.value)} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                            <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            )}

            {/* Sistem */}
            {tab === 'sistem' && (
                <div className="card">
                    <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Pengelola Sarana Prasarana</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Waka Sarpras / Koordinator</label>
                            <input className="form-input" value={settings.sarpras_head || ''} onChange={e => updateField('sarpras_head', e.target.value)} placeholder="Nama Koordinator Sarpras" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">NIP Waka Sarpras</label>
                            <input className="form-input" value={settings.sarpras_head_nip || ''} onChange={e => updateField('sarpras_head_nip', e.target.value)} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Catatan Kebijakan Peminjaman</label>
                        <textarea className="form-textarea" value={settings.sarpras_policy || ''} onChange={e => updateField('sarpras_policy', e.target.value)} rows={3} placeholder="Aturan atau catatan terkait peminjaman ruang dan barang..." />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button className="btn btn-primary" onClick={saveSettings} disabled={saving}>
                            <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </div>
            )}

            {toast && (
                <div className="toast-container" style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
                    <div className={`toast toast-${toast.type}`} style={{
                        background: toast.type === 'success' ? '#10B981' : '#EF4444',
                        color: 'white', padding: '10px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500
                    }}>
                        {toast.msg}
                    </div>
                </div>
            )}
        </div>
    );
}
