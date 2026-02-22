'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, X, FlaskConical, Microscope, AlertTriangle, Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface Item {
    id: number; code: string; name: string; type: string; category_id: number;
    category_name: string; quantity: number; unit: string; condition: string;
    location: string; acquired_date: string; source: string; price: number;
    min_stock: number; notes: string;
}

interface Category { id: number; name: string; type: string; description: string; }

export default function InventarisPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'alat' | 'bahan'>('alat');
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editItem, setEditItem] = useState<Item | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

    const [form, setForm] = useState({
        code: '', name: '', type: 'alat', category_id: '', quantity: 0, unit: 'pcs',
        condition: 'baik', location: '', acquired_date: '', source: '', price: 0, min_stock: 0, notes: ''
    });

    const showToast = (msg: string, type: string) => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchItems = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ type: tab, page: String(page), search, limit: '20' });
        if (categoryFilter) params.set('category_id', categoryFilter);
        const res = await fetch(`/api/items?${params}`);
        const data = await res.json();
        setItems(data.items || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setLoading(false);
    }, [tab, page, search, categoryFilter]);

    const fetchCategories = useCallback(async () => {
        const res = await fetch(`/api/categories?type=${tab}`);
        const data = await res.json();
        setCategories(data || []);
    }, [tab]);

    useEffect(() => { fetchItems(); }, [fetchItems]);
    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { setPage(1); }, [tab, search, categoryFilter]);

    const openAdd = () => {
        setEditItem(null);
        setForm({ code: '', name: '', type: tab, category_id: '', quantity: 0, unit: 'pcs', condition: 'baik', location: '', acquired_date: '', source: '', price: 0, min_stock: 0, notes: '' });
        setShowModal(true);
    };

    const openEdit = (item: Item) => {
        setEditItem(item);
        setForm({
            code: item.code || '', name: item.name, type: item.type, category_id: item.category_id ? String(item.category_id) : '',
            quantity: item.quantity, unit: item.unit, condition: item.condition, location: item.location || '',
            acquired_date: item.acquired_date || '', source: item.source || '', price: item.price, min_stock: item.min_stock, notes: item.notes || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        const payload = { ...form, category_id: form.category_id ? parseInt(form.category_id) : null };
        const url = editItem ? `/api/items/${editItem.id}` : '/api/items';
        const method = editItem ? 'PUT' : 'POST';
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) {
            showToast(editItem ? 'Item diperbarui' : 'Item ditambahkan', 'success');
            setShowModal(false);
            fetchItems();
        } else {
            const data = await res.json();
            showToast(data.error || 'Gagal menyimpan', 'error');
        }
    };

    const handleDelete = async (item: Item) => {
        if (!confirm(`Hapus "${item.name}"?`)) return;
        const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Item dihapus', 'success'); fetchItems(); }
        else showToast('Gagal menghapus', 'error');
    };

    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const handleImport = async () => {
        if (!importFile) { showToast('Pilih file Excel terlebih dahulu', 'error'); return; }
        setImporting(true);
        const fd = new FormData();
        fd.append('file', importFile);
        try {
            const res = await fetch('/api/import/items', { method: 'POST', body: fd });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || 'Gagal import', 'error'); setImporting(false); return; }
            setImportResult(data);
            if (data.imported > 0) fetchItems();
        } catch { showToast('Gagal upload file', 'error'); }
        setImporting(false);
    };

    const downloadTemplate = () => { window.location.href = '/api/import/items'; };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Inventaris Alat & Bahan</h1>
                    <p>Kelola database alat dan bahan laboratorium IPA</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => { setShowImportModal(true); setImportFile(null); setImportResult(null); }}>
                        <Upload size={15} /> Import Excel
                    </button>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Tambah {tab === 'alat' ? 'Alat' : 'Bahan'}</button>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs" style={{ display: 'inline-flex', marginBottom: 20 }}>
                <button className={`tab ${tab === 'alat' ? 'active' : ''}`} onClick={() => setTab('alat')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Microscope size={14} /> Alat</span>
                </button>
                <button className={`tab ${tab === 'bahan' ? 'active' : ''}`} onClick={() => setTab('bahan')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FlaskConical size={14} /> Bahan</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-bar">
                    <Search size={15} />
                    <input className="form-input" placeholder="Cari nama atau kode..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 200 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="">Semua Kategori</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 'auto' }}>{total} item</span>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Kode</th>
                            <th>Nama</th>
                            <th>Kategori</th>
                            <th>Jumlah</th>
                            <th>Kondisi</th>
                            <th>Lokasi</th>
                            <th>Harga</th>
                            <th style={{ width: 80 }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={8}><div className="empty-state"><FlaskConical size={40} /><h3>Belum ada data</h3><p>Tambahkan {tab} baru</p></div></td></tr>
                        ) : items.map(item => (
                            <tr key={item.id}>
                                <td><span style={{ fontFamily: 'monospace', fontSize: 12 }}>{item.code || '-'}</span></td>
                                <td>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                    {item.quantity <= item.min_stock && item.min_stock > 0 && (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#F59E0B', marginTop: 2 }}>
                                            <AlertTriangle size={11} /> Stok menipis
                                        </span>
                                    )}
                                </td>
                                <td>{item.category_name || '-'}</td>
                                <td>
                                    <span className={`badge ${item.quantity <= item.min_stock && item.min_stock > 0 ? (item.quantity === 0 ? 'badge-red' : 'badge-yellow') : 'badge-teal'}`}>
                                        {item.quantity} {item.unit}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${item.condition === 'baik' ? 'badge-green' : item.condition === 'rusak ringan' ? 'badge-yellow' : 'badge-red'}`}>
                                        {item.condition}
                                    </span>
                                </td>
                                <td>{item.location || '-'}</td>
                                <td>{formatCurrency(item.price)}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                                        <button className="btn-icon" onClick={() => handleDelete(item)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="pagination">
                        <span>Hal {page}/{totalPages}</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editItem ? 'Edit' : 'Tambah'} {tab === 'alat' ? 'Alat' : 'Bahan'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kode</label>
                                    <input className="form-input" placeholder="ALT-001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama *</label>
                                    <input className="form-input" placeholder="Nama alat/bahan" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Kategori</label>
                                    <select className="form-select" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                                        <option value="">-- Pilih --</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kondisi</label>
                                    <select className="form-select" value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}>
                                        <option value="baik">Baik</option>
                                        <option value="rusak ringan">Rusak Ringan</option>
                                        <option value="rusak berat">Rusak Berat</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Jumlah</label>
                                    <input className="form-input" type="number" min={0} value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Satuan</label>
                                    <input className="form-input" placeholder="pcs, unit, liter, kg..." value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Lokasi</label>
                                    <input className="form-input" placeholder="Lemari A-1" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Stok Minimum</label>
                                    <input className="form-input" type="number" min={0} value={form.min_stock} onChange={e => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Harga Satuan (Rp)</label>
                                    <input className="form-input" type="number" min={0} value={form.price} onChange={e => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sumber</label>
                                    <input className="form-input" placeholder="Pembelian, hibah, dll" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Catatan</label>
                                <textarea className="form-textarea" placeholder="Catatan tambahan..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
                        <div className="modal-header">
                            <h2><FileSpreadsheet size={18} style={{ marginRight: 6 }} /> Import dari Excel</h2>
                            <button className="btn-icon" onClick={() => setShowImportModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            {!importResult ? (
                                <>
                                    {/* Download template */}
                                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Download size={15} style={{ color: 'var(--accent)' }} />
                                            <strong style={{ fontSize: 13.5 }}>1. Download Template</strong>
                                        </div>
                                        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            Download template Excel yang sudah menyertakan format kolom, contoh data, dan daftar kategori yang terdaftar.
                                        </p>
                                        <button className="btn btn-sm btn-secondary" onClick={downloadTemplate}>
                                            <Download size={13} /> Download Template
                                        </button>
                                    </div>

                                    {/* Upload file */}
                                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: '16px 18px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Upload size={15} style={{ color: 'var(--accent)' }} />
                                            <strong style={{ fontSize: 13.5 }}>2. Upload File</strong>
                                        </div>
                                        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                            Pilih file Excel (.xlsx) yang sudah diisi sesuai template.
                                        </p>
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={e => setImportFile(e.target.files?.[0] || null)}
                                            style={{ fontSize: 13 }}
                                        />
                                        {importFile && (
                                            <div style={{ marginTop: 8, fontSize: 12.5, color: 'var(--text-muted)' }}>
                                                📄 {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                /* Import results */
                                <div>
                                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                        <CheckCircle2 size={40} style={{ color: 'var(--success)', marginBottom: 8 }} />
                                        <h3 style={{ margin: 0, fontSize: 16 }}>Import Selesai</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(16,185,129,0.1)', borderRadius: 10 }}>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)' }}>{importResult.imported}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Berhasil</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(245,158,11,0.1)', borderRadius: 10 }}>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: '#F59E0B' }}>{importResult.skipped}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Dilewati</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(239,68,68,0.1)', borderRadius: 10 }}>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: '#EF4444' }}>{importResult.errors.length}</div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Peringatan</div>
                                        </div>
                                    </div>
                                    {importResult.errors.length > 0 && (
                                        <div style={{ maxHeight: 160, overflowY: 'auto', background: 'var(--bg-tertiary)', borderRadius: 8, padding: 12 }}>
                                            {importResult.errors.map((err, i) => (
                                                <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'start', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                                    <AlertCircle size={12} style={{ marginTop: 2, flexShrink: 0, color: '#F59E0B' }} /> {err}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            {!importResult ? (
                                <>
                                    <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Batal</button>
                                    <button className="btn btn-primary" onClick={handleImport} disabled={!importFile || importing}>
                                        <Upload size={14} /> {importing ? 'Mengimport...' : 'Import Sekarang'}
                                    </button>
                                </>
                            ) : (
                                <button className="btn btn-primary" onClick={() => setShowImportModal(false)}>Tutup</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
                </div>
            )}
        </>
    );
}
