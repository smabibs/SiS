'use client';

import { useState } from 'react';
import { Upload, Download, Database, AlertTriangle, Save } from 'lucide-react';

interface Toast { id: number; type: 'success' | 'error'; message: string; }

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    <span style={{ flex: 1 }}>{t.message}</span>
                    <button onClick={() => onRemove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>X</button>
                </div>
            ))}
        </div>
    );
}

export default function SarprasBackupPage() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    return (
        <div>
            <ToastContainer toasts={toasts} onRemove={id => setToasts(prev => prev.filter(t => t.id !== id))} />
            <div className="page-header">
                <div>
                    <h1>Backup & Restore</h1>
                    <p>Unduh atau pulihkan database SiSarpras</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 700px)', gap: 20 }}>
                {/* Backup */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,110,247,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Download size={18} color="#4F6EF7" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Backup Database</h3>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Unduh file database sistem</p>
                        </div>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                        Simpan salinan database (<code>labipa.db</code>) untuk keamanan data. Backup mencakup semua data dari ketiga sistem (Lab IPA, Sarpras, dan SiPERPUS).
                    </p>
                    <button
                        className="btn btn-primary"
                        disabled={backupLoading}
                        onClick={async () => {
                            setBackupLoading(true);
                            try {
                                const res = await fetch('/api/sarpras/backup');
                                if (!res.ok) throw new Error('Gagal membuat backup');
                                const blob = await res.blob();
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = res.headers.get('Content-Disposition')?.split('filename="')[1]?.replace(/"/g, '') || 'backup.db';
                                a.click();
                                URL.revokeObjectURL(url);
                                addToast('Backup berhasil diunduh!');
                            } catch (err) {
                                addToast(String(err), 'error');
                            }
                            setBackupLoading(false);
                        }}
                    >
                        <Download size={15} /> {backupLoading ? 'Mengunduh...' : 'Download Backup'}
                    </button>
                </div>

                {/* Restore */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(248,81,73,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={18} color="#F85149" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Restore Database</h3>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Pulihkan database dari file .db</p>
                        </div>
                    </div>
                    <div style={{
                        background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)',
                        borderRadius: 10, padding: '12px 14px', marginBottom: 16,
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}>
                        <AlertTriangle size={16} color="#F85149" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            <strong>Peringatan:</strong> Restore akan menggantikan SELURUH data di ketiga sistem (Lab IPA, Sarpras, SiPERPUS). Pastikan Anda memilih file yang benar.
                        </div>
                    </div>
                    <input
                        id="restoreFileSarpras"
                        type="file"
                        accept=".db"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!confirm('Anda yakin ingin me-restore database? Semua data saat ini akan diganti.')) {
                                e.target.value = '';
                                return;
                            }
                            setRestoreLoading(true);
                            try {
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch('/api/sarpras/backup', { method: 'POST', body: formData });
                                const data = await res.json();
                                if (!res.ok) throw new Error(data.error);
                                addToast('Database berhasil di-restore! Memuat ulang...', 'success');
                                setTimeout(() => window.location.reload(), 2000);
                            } catch (err) {
                                addToast(String(err), 'error');
                            }
                            setRestoreLoading(false);
                            e.target.value = '';
                        }}
                    />
                    <button
                        className="btn" style={{ background: 'rgba(248,81,73,0.1)', color: '#F85149', border: '1px solid rgba(248,81,73,0.2)' }}
                        disabled={restoreLoading}
                        onClick={() => document.getElementById('restoreFileSarpras')?.click()}
                    >
                        <Upload size={15} /> {restoreLoading ? 'Memulihkan...' : 'Upload & Restore'}
                    </button>
                </div>
            </div>
        </div>
    );
}
