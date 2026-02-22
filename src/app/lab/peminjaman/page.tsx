'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, RotateCcw, Trash2, X, ClipboardList, Package, ChevronDown } from 'lucide-react';

interface Loan {
    id: number; borrower_name: string; borrower_class: string; purpose: string;
    subject: string; loan_date: string; due_date: string; return_date: string;
    status: string; notes: string; item_names: string; total_items: number;
}

interface LoanDetail extends Loan {
    items: { id: number; item_id: number; item_name: string; item_code: string; quantity: number; returned_quantity: number; unit: string; condition_before: string; condition_after: string }[];
}

interface AvailableItem { id: number; code: string; name: string; quantity: number; unit: string; type: string; category_name: string; }

export default function PeminjamanPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState<LoanDetail | null>(null);
    const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
    const [itemPickerOpen, setItemPickerOpen] = useState<number | null>(null);
    const [itemSearch, setItemSearch] = useState('');

    const [form, setForm] = useState({
        borrower_name: '', borrower_class: '', purpose: '', subject: '',
        loan_date: new Date().toISOString().split('T')[0],
        due_date: '', notes: '',
        items: [{ item_id: 0, quantity: 1, condition_before: 'baik' }] as { item_id: number; quantity: number; condition_before: string }[]
    });

    const [returnItems, setReturnItems] = useState<{ loan_item_id: number; item_id: number; returned_quantity: number; condition_after: string }[]>([]);

    const showToast = (msg: string, type: string) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), search });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/loans?${params}`);
        const data = await res.json();
        setLoans(data.loans || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, search, statusFilter]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);
    useEffect(() => { setPage(1); }, [search, statusFilter]);

    const fetchAvailableItems = async () => {
        const res = await fetch('/api/items?limit=200');
        const data = await res.json();
        setAvailableItems((data.items || []).filter((i: AvailableItem) => i.quantity > 0));
    };

    const openAdd = () => {
        fetchAvailableItems();
        setForm({
            borrower_name: '', borrower_class: '', purpose: '', subject: '',
            loan_date: new Date().toISOString().split('T')[0], due_date: '', notes: '',
            items: [{ item_id: 0, quantity: 1, condition_before: 'baik' }]
        });
        setShowAddModal(true);
    };

    const openDetail = async (loan: Loan) => {
        const res = await fetch(`/api/loans/${loan.id}`);
        const data = await res.json();
        setSelectedLoan(data);
        setShowDetailModal(true);
    };

    const openReturn = async (loan: Loan) => {
        const res = await fetch(`/api/loans/${loan.id}`);
        const data = await res.json() as LoanDetail;
        setSelectedLoan(data);
        setReturnItems(data.items.map(i => ({
            loan_item_id: i.id, item_id: i.item_id,
            returned_quantity: i.quantity - i.returned_quantity,
            condition_after: 'baik'
        })));
        setShowReturnModal(true);
    };

    const addItemRow = () => {
        setForm({ ...form, items: [...form.items, { item_id: 0, quantity: 1, condition_before: 'baik' }] });
    };

    const removeItemRow = (idx: number) => {
        setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
    };

    const updateItemRow = (idx: number, field: string, value: string | number) => {
        const newItems = [...form.items];
        (newItems[idx] as Record<string, unknown>)[field] = value;
        setForm({ ...form, items: newItems });
    };

    const handleSave = async () => {
        if (!form.borrower_name || form.items.some(i => !i.item_id)) {
            showToast('Lengkapi data peminjam dan item', 'error'); return;
        }
        const res = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (res.ok) { showToast('Peminjaman berhasil dicatat', 'success'); setShowAddModal(false); fetchLoans(); }
        else { const d = await res.json(); showToast(d.error || 'Gagal', 'error'); }
    };

    const handleReturn = async () => {
        if (!selectedLoan) return;
        const res = await fetch(`/api/loans/${selectedLoan.id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'return', return_items: returnItems })
        });
        if (res.ok) { showToast('Pengembalian berhasil dicatat', 'success'); setShowReturnModal(false); fetchLoans(); }
        else { const d = await res.json(); showToast(d.error || 'Gagal', 'error'); }
    };

    const handleDelete = async (loan: Loan) => {
        if (!confirm(`Hapus peminjaman "${loan.borrower_name}"?`)) return;
        const res = await fetch(`/api/loans/${loan.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Peminjaman dihapus', 'success'); fetchLoans(); }
    };

    return (
        <>
            <div className="page-header">
                <div>
                    <h1>Peminjaman & Pengembalian</h1>
                    <p>Kelola peminjaman dan pengembalian alat/bahan laboratorium</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Peminjaman Baru</button>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <div className="search-bar">
                    <Search size={15} />
                    <input className="form-input" placeholder="Cari peminjam..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Semua Status</option>
                    <option value="dipinjam">Dipinjam</option>
                    <option value="terlambat">Terlambat</option>
                    <option value="dikembalikan">Dikembalikan</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-container">
                <table>
                    <thead><tr>
                        <th>Peminjam</th><th>Kelas</th><th>Tujuan</th><th>Tgl Pinjam</th><th>Jatuh Tempo</th><th>Status</th><th>Aksi</th>
                    </tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                        ) : loans.length === 0 ? (
                            <tr><td colSpan={7}><div className="empty-state"><ClipboardList size={40} /><h3>Belum ada peminjaman</h3></div></td></tr>
                        ) : loans.map(loan => (
                            <tr key={loan.id}>
                                <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{loan.borrower_name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{loan.item_names ? (loan.item_names.length > 50 ? loan.item_names.slice(0, 50) + '…' : loan.item_names) : '-'}</div>
                                </td>
                                <td>{loan.borrower_class || '-'}</td>
                                <td>{loan.purpose || '-'}</td>
                                <td>{loan.loan_date}</td>
                                <td>{loan.due_date || '-'}</td>
                                <td><span className={`badge ${loan.status === 'terlambat' ? 'badge-red' : loan.status === 'dipinjam' ? 'badge-blue' : 'badge-green'}`}>
                                    {loan.status === 'dipinjam' ? 'Dipinjam' : loan.status === 'terlambat' ? 'Terlambat' : 'Dikembalikan'}
                                </span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icon" onClick={() => openDetail(loan)} title="Detail"><Eye size={14} /></button>
                                        {loan.status !== 'dikembalikan' && (
                                            <button className="btn-icon" onClick={() => openReturn(loan)} title="Kembalikan" style={{ color: 'var(--success)' }}><RotateCcw size={14} /></button>
                                        )}
                                        <button className="btn-icon" onClick={() => handleDelete(loan)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
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

            {/* Add Loan Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Peminjaman Baru</h2>
                            <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Peminjam *</label>
                                    <input className="form-input" placeholder="Nama peminjam / guru" value={form.borrower_name} onChange={e => setForm({ ...form, borrower_name: e.target.value })} />
                                </div>
                                <div className="form-group"><label className="form-label">Kelas</label>
                                    <input className="form-input" placeholder="XI IPA 1" value={form.borrower_class} onChange={e => setForm({ ...form, borrower_class: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Tujuan</label>
                                    <input className="form-input" placeholder="Praktikum..." value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} />
                                </div>
                                <div className="form-group"><label className="form-label">Mata Pelajaran</label>
                                    <input className="form-input" placeholder="Fisika, Kimia, Biologi" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Tgl Pinjam</label>
                                    <input className="form-input" type="date" value={form.loan_date} onChange={e => setForm({ ...form, loan_date: e.target.value })} />
                                </div>
                                <div className="form-group"><label className="form-label">Jatuh Tempo</label>
                                    <input className="form-input" type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
                                </div>
                            </div>

                            <div style={{ marginTop: 16, marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <label className="form-label" style={{ margin: 0 }}>Item yang Dipinjam *</label>
                                    <button className="btn btn-sm btn-secondary" onClick={addItemRow}><Plus size={12} /> Tambah</button>
                                </div>
                                {form.items.map((item, idx) => {
                                    const selectedItem = availableItems.find(ai => ai.id === item.item_id);
                                    const isOpen = itemPickerOpen === idx;

                                    // Build grouped + filtered items
                                    const searchLower = itemSearch.toLowerCase();
                                    const filtered = availableItems.filter(ai =>
                                        !itemSearch || ai.name.toLowerCase().includes(searchLower) || (ai.code && ai.code.toLowerCase().includes(searchLower))
                                    );
                                    const grouped: Record<string, AvailableItem[]> = {};
                                    filtered.forEach(ai => {
                                        const cat = ai.category_name || 'Tanpa Kategori';
                                        if (!grouped[cat]) grouped[cat] = [];
                                        grouped[cat].push(ai);
                                    });
                                    // Sort categories alphabetically
                                    const sortedCategories = Object.keys(grouped).sort((a, b) => {
                                        if (a === 'Tanpa Kategori') return 1;
                                        if (b === 'Tanpa Kategori') return -1;
                                        return a.localeCompare(b);
                                    });

                                    return (
                                        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                            {/* Custom item picker */}
                                            <div style={{ flex: 2, position: 'relative' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => { setItemPickerOpen(isOpen ? null : idx); setItemSearch(''); }}
                                                    style={{
                                                        width: '100%', textAlign: 'left', padding: '8px 12px',
                                                        background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                                                        borderRadius: 8, color: selectedItem ? 'var(--text-primary)' : 'var(--text-muted)',
                                                        fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    }}
                                                >
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {selectedItem ? (
                                                            <>{selectedItem.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>(stok: {selectedItem.quantity} {selectedItem.unit})</span></>
                                                        ) : '-- Pilih Item --'}
                                                    </span>
                                                    <ChevronDown size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
                                                </button>

                                                {isOpen && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                                                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                                                        borderRadius: 10, marginTop: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                                                        maxHeight: 300, display: 'flex', flexDirection: 'column',
                                                    }}>
                                                        {/* Search input */}
                                                        <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-tertiary)', borderRadius: 6, padding: '6px 10px' }}>
                                                                <Search size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                                <input
                                                                    autoFocus
                                                                    placeholder="Cari alat / bahan..."
                                                                    value={itemSearch}
                                                                    onChange={e => setItemSearch(e.target.value)}
                                                                    onClick={e => e.stopPropagation()}
                                                                    style={{
                                                                        border: 'none', background: 'transparent', outline: 'none',
                                                                        color: 'var(--text-primary)', fontSize: 12.5, width: '100%',
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Category-grouped items */}
                                                        <div style={{ overflowY: 'auto', flex: 1 }}>
                                                            {sortedCategories.length === 0 ? (
                                                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5 }}>
                                                                    Tidak ada item ditemukan
                                                                </div>
                                                            ) : sortedCategories.map(cat => (
                                                                <div key={cat}>
                                                                    <div style={{
                                                                        padding: '6px 12px', fontSize: 11, fontWeight: 700,
                                                                        color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.5,
                                                                        background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)',
                                                                        position: 'sticky', top: 0,
                                                                    }}>
                                                                        {cat}
                                                                    </div>
                                                                    {grouped[cat].map(ai => (
                                                                        <div
                                                                            key={ai.id}
                                                                            onClick={() => { updateItemRow(idx, 'item_id', ai.id); setItemPickerOpen(null); }}
                                                                            style={{
                                                                                padding: '7px 12px 7px 20px', cursor: 'pointer', fontSize: 12.5,
                                                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                                background: ai.id === item.item_id ? 'rgba(13,148,136,0.12)' : 'transparent',
                                                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                                            }}
                                                                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(13,148,136,0.08)')}
                                                                            onMouseLeave={e => (e.currentTarget.style.background = ai.id === item.item_id ? 'rgba(13,148,136,0.12)' : 'transparent')}
                                                                        >
                                                                            <div>
                                                                                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{ai.name}</div>
                                                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                                                                                    {ai.code && <span style={{ marginRight: 6 }}>{ai.code}</span>}
                                                                                    <span className={`badge ${ai.type === 'alat' ? 'badge-blue' : 'badge-teal'}`} style={{ fontSize: 9.5, padding: '1px 5px' }}>{ai.type}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ textAlign: 'right', fontSize: 11.5, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                                                {ai.quantity} {ai.unit}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <input className="form-input" type="number" min={1} style={{ width: 80 }} value={item.quantity} onChange={e => updateItemRow(idx, 'quantity', parseInt(e.target.value) || 1)} />
                                            {form.items.length > 1 && (
                                                <button className="btn-icon" onClick={() => removeItemRow(idx)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button>
                            <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedLoan && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Detail Peminjaman</h2>
                            <button className="btn-icon" onClick={() => setShowDetailModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13.5 }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Peminjam:</span> <strong>{selectedLoan.borrower_name}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Kelas:</span> {selectedLoan.borrower_class || '-'}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Tujuan:</span> {selectedLoan.purpose || '-'}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Mapel:</span> {selectedLoan.subject || '-'}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Tgl Pinjam:</span> {selectedLoan.loan_date}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Jatuh Tempo:</span> {selectedLoan.due_date || '-'}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${selectedLoan.status === 'terlambat' ? 'badge-red' : selectedLoan.status === 'dipinjam' ? 'badge-blue' : 'badge-green'}`}>{selectedLoan.status}</span></div>
                            </div>
                            <h3 style={{ fontSize: 14, margin: '16px 0 8px', color: 'var(--text-primary)' }}>Item:</h3>
                            {selectedLoan.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{item.item_name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.item_code}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div>{item.quantity} {item.unit}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Dikembalikan: {item.returned_quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {showReturnModal && selectedLoan && (
                <div className="modal-overlay" onClick={() => setShowReturnModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Pengembalian</h2>
                            <button className="btn-icon" onClick={() => setShowReturnModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 16 }}>
                                <Package size={14} style={{ verticalAlign: 'middle' }} /> Peminjam: <strong>{selectedLoan.borrower_name}</strong>
                            </p>
                            {selectedLoan.items.map((item, idx) => {
                                const remaining = item.quantity - item.returned_quantity;
                                if (remaining <= 0) return null;
                                return (
                                    <div key={item.id} style={{ padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 8 }}>
                                        <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>{item.item_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({remaining} {item.unit} belum kembali)</span></div>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Jumlah Kembali</label>
                                                <input className="form-input" type="number" min={0} max={remaining} value={returnItems[idx]?.returned_quantity || 0}
                                                    onChange={e => { const n = [...returnItems]; n[idx] = { ...n[idx], returned_quantity: parseInt(e.target.value) || 0 }; setReturnItems(n); }} />
                                            </div>
                                            <div className="form-group" style={{ flex: 1, margin: 0 }}>
                                                <label className="form-label" style={{ fontSize: 11 }}>Kondisi</label>
                                                <select className="form-select" value={returnItems[idx]?.condition_after || 'baik'}
                                                    onChange={e => { const n = [...returnItems]; n[idx] = { ...n[idx], condition_after: e.target.value }; setReturnItems(n); }}>
                                                    <option value="baik">Baik</option>
                                                    <option value="rusak ringan">Rusak Ringan</option>
                                                    <option value="rusak berat">Rusak Berat</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowReturnModal(false)}>Batal</button>
                            <button className="btn btn-success" onClick={handleReturn}><RotateCcw size={14} /> Proses Pengembalian</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
        </>
    );
}
