'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Eye, Check, XCircle, Trash2, X, PackagePlus } from 'lucide-react';

interface Request {
    id: number; requester_name: string; purpose: string; priority: string;
    request_date: string; status: string; rejection_reason: string;
    item_count: number; total_cost: number;
}

interface RequestDetail extends Request {
    items: { id: number; item_name: string; quantity: number; unit: string; estimated_price: number; specification: string }[];
}

export default function PengajuanPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

    const [form, setForm] = useState({
        requester_name: '', purpose: '', priority: 'sedang', notes: '',
        items: [{ item_name: '', quantity: 1, unit: 'pcs', estimated_price: 0, specification: '' }]
    });

    const showToast = (msg: string, type: string) => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page) });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/requests?${params}`);
        const data = await res.json();
        setRequests(data.requests || []);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
    }, [page, statusFilter]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);
    useEffect(() => { setPage(1); }, [statusFilter]);

    const openDetail = async (r: Request) => {
        const res = await fetch(`/api/requests/${r.id}`);
        setSelectedRequest(await res.json());
        setShowDetailModal(true);
    };

    const updateStatus = async (id: number, status: string, reason?: string) => {
        const res = await fetch(`/api/requests/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, rejection_reason: reason })
        });
        if (res.ok) { showToast(`Status diubah: ${status}`, 'success'); fetchRequests(); setShowDetailModal(false); }
    };

    const handleSave = async () => {
        if (!form.requester_name || form.items.some(i => !i.item_name)) {
            showToast('Lengkapi data', 'error'); return;
        }
        const res = await fetch('/api/requests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (res.ok) { showToast('Pengajuan berhasil dibuat', 'success'); setShowAddModal(false); fetchRequests(); }
        else { const d = await res.json(); showToast(d.error || 'Gagal', 'error'); }
    };

    const handleDelete = async (r: Request) => {
        if (!confirm(`Hapus pengajuan "${r.requester_name}"?`)) return;
        const res = await fetch(`/api/requests/${r.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Dihapus', 'success'); fetchRequests(); }
    };

    const addItemRow = () => setForm({ ...form, items: [...form.items, { item_name: '', quantity: 1, unit: 'pcs', estimated_price: 0, specification: '' }] });
    const removeItemRow = (idx: number) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

    const formatCurrency = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    const priorityBadge = (p: string) => p === 'tinggi' ? 'badge-red' : p === 'sedang' ? 'badge-yellow' : 'badge-teal';
    const statusBadge = (s: string) => s === 'pending' ? 'badge-yellow' : s === 'disetujui' ? 'badge-blue' : s === 'ditolak' ? 'badge-red' : 'badge-green';

    return (
        <>
            <div className="page-header">
                <div><h1>Pengajuan Alat & Bahan</h1><p>Pengajuan kebutuhan alat dan bahan laboratorium baru</p></div>
                <button className="btn btn-primary" onClick={() => {
                    setForm({ requester_name: '', purpose: '', priority: 'sedang', notes: '', items: [{ item_name: '', quantity: 1, unit: 'pcs', estimated_price: 0, specification: '' }] });
                    setShowAddModal(true);
                }}><Plus size={16} /> Pengajuan Baru</button>
            </div>

            <div className="toolbar">
                <select className="form-select" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">Semua Status</option>
                    <option value="pending">Pending</option>
                    <option value="disetujui">Disetujui</option>
                    <option value="ditolak">Ditolak</option>
                    <option value="terpenuhi">Terpenuhi</option>
                </select>
            </div>

            <div className="table-container">
                <table>
                    <thead><tr><th>Pengaju</th><th>Tujuan</th><th>Prioritas</th><th>Tgl Ajuan</th><th>Jumlah Item</th><th>Estimasi Biaya</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8}><div className="loading-overlay"><div className="spinner" /></div></td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan={8}><div className="empty-state"><PackagePlus size={40} /><h3>Belum ada pengajuan</h3></div></td></tr>
                        ) : requests.map(r => (
                            <tr key={r.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.requester_name}</td>
                                <td>{r.purpose || '-'}</td>
                                <td><span className={`badge ${priorityBadge(r.priority)}`}>{r.priority}</span></td>
                                <td>{r.request_date}</td>
                                <td>{r.item_count} item</td>
                                <td>{formatCurrency(r.total_cost || 0)}</td>
                                <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <button className="btn-icon" onClick={() => openDetail(r)}><Eye size={14} /></button>
                                        {r.status === 'pending' && <>
                                            <button className="btn-icon" onClick={() => updateStatus(r.id, 'disetujui')} style={{ color: 'var(--success)' }}><Check size={14} /></button>
                                            <button className="btn-icon" onClick={() => { const reason = prompt('Alasan penolakan:'); if (reason) updateStatus(r.id, 'ditolak', reason); }} style={{ color: 'var(--danger)' }}><XCircle size={14} /></button>
                                        </>}
                                        {r.status === 'disetujui' && <button className="btn-icon" onClick={() => updateStatus(r.id, 'terpenuhi')} style={{ color: 'var(--accent)' }}><Check size={14} /></button>}
                                        <button className="btn-icon" onClick={() => handleDelete(r)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div className="pagination"><span>Hal {page}/{totalPages}</span>
                        <div className="pagination-buttons">
                            <button className="btn btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="btn btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Pengajuan Baru</h2><button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={16} /></button></div>
                        <div className="modal-body">
                            <div className="form-row">
                                <div className="form-group"><label className="form-label">Pengaju *</label>
                                    <input className="form-input" value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Prioritas</label>
                                    <select className="form-select" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="rendah">Rendah</option><option value="sedang">Sedang</option><option value="tinggi">Tinggi</option>
                                    </select></div>
                            </div>
                            <div className="form-group"><label className="form-label">Tujuan</label>
                                <input className="form-input" value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} /></div>
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <label className="form-label" style={{ margin: 0 }}>Item yang Diajukan *</label>
                                    <button className="btn btn-sm btn-secondary" onClick={addItemRow}><Plus size={12} /> Tambah</button>
                                </div>
                                {form.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'end' }}>
                                        <div className="form-group" style={{ flex: 2, margin: 0 }}>
                                            {idx === 0 && <label className="form-label" style={{ fontSize: 11 }}>Nama Item</label>}
                                            <input className="form-input" placeholder="Nama item" value={item.item_name} onChange={e => { const n = [...form.items]; n[idx] = { ...n[idx], item_name: e.target.value }; setForm({ ...form, items: n }); }} />
                                        </div>
                                        <div className="form-group" style={{ width: 70, margin: 0 }}>
                                            {idx === 0 && <label className="form-label" style={{ fontSize: 11 }}>Jml</label>}
                                            <input className="form-input" type="number" min={1} value={item.quantity} onChange={e => { const n = [...form.items]; n[idx] = { ...n[idx], quantity: parseInt(e.target.value) || 1 }; setForm({ ...form, items: n }); }} />
                                        </div>
                                        <div className="form-group" style={{ width: 80, margin: 0 }}>
                                            {idx === 0 && <label className="form-label" style={{ fontSize: 11 }}>Satuan</label>}
                                            <input className="form-input" value={item.unit} onChange={e => { const n = [...form.items]; n[idx] = { ...n[idx], unit: e.target.value }; setForm({ ...form, items: n }); }} />
                                        </div>
                                        <div className="form-group" style={{ width: 110, margin: 0 }}>
                                            {idx === 0 && <label className="form-label" style={{ fontSize: 11 }}>Harga (Rp)</label>}
                                            <input className="form-input" type="number" min={0} value={item.estimated_price} onChange={e => { const n = [...form.items]; n[idx] = { ...n[idx], estimated_price: parseInt(e.target.value) || 0 }; setForm({ ...form, items: n }); }} />
                                        </div>
                                        {form.items.length > 1 && <button className="btn-icon" onClick={() => removeItemRow(idx)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Batal</button><button className="btn btn-primary" onClick={handleSave}>Simpan</button></div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedRequest && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Detail Pengajuan</h2><button className="btn-icon" onClick={() => setShowDetailModal(false)}><X size={16} /></button></div>
                        <div className="modal-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16, fontSize: 13.5 }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Pengaju:</span> <strong>{selectedRequest.requester_name}</strong></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Prioritas:</span> <span className={`badge ${priorityBadge(selectedRequest.priority)}`}>{selectedRequest.priority}</span></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Tujuan:</span> {selectedRequest.purpose || '-'}</div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Status:</span> <span className={`badge ${statusBadge(selectedRequest.status)}`}>{selectedRequest.status}</span></div>
                            </div>
                            {selectedRequest.rejection_reason && (
                                <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#EF4444' }}>
                                    <strong>Alasan Penolakan:</strong> {selectedRequest.rejection_reason}
                                </div>
                            )}
                            <h3 style={{ fontSize: 14, margin: '16px 0 8px' }}>Item:</h3>
                            {selectedRequest.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
                                    <div><div style={{ fontWeight: 600 }}>{item.item_name}</div>
                                        {item.specification && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.specification}</div>}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div>{item.quantity} {item.unit}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>@ {formatCurrency(item.estimated_price)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className="toast-container"><div className={`toast toast-${toast.type}`}>{toast.msg}</div></div>}
        </>
    );
}
