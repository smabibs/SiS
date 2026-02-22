'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Package,
    ClipboardList,
    FileBarChart2,
    Settings,
    LogOut,
    Sun,
    Moon,
    Home,
    PackagePlus,
    Database
} from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

const navItems = [
    {
        section: 'Utama',
        items: [
            { href: '/sarpras', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        section: 'Inventaris',
        items: [
            { href: '/sarpras/ruangan', label: 'Ruangan & Gedung', icon: Building2 },
            { href: '/sarpras/barang', label: 'Barang Inventaris', icon: Package },
        ],
    },
    {
        section: 'Manajemen',
        items: [
            { href: '/sarpras/peminjaman', label: 'Peminjaman', icon: ClipboardList },
            { href: '/sarpras/pengajuan', label: 'Pengajuan', icon: PackagePlus },
        ],
    },
    {
        section: 'Laporan',
        items: [
            { href: '/sarpras/laporan', label: 'Laporan', icon: FileBarChart2 },
        ],
    },
    {
        section: 'Sistem',
        items: [
            { href: '/sarpras/pengaturan', label: 'Pengaturan', icon: Settings },
            { href: '/sarpras/audit', label: 'Audit Log', icon: ClipboardList },
            { href: '/sarpras/backup', label: 'Backup & Restore', icon: Database },
        ],
    },
];

export default function SarprasSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const [schoolName, setSchoolName] = useState('SiSarpras');

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(d => {
                if (d.school_name) setSchoolName(d.school_name);
            })
            .catch(() => { });
    }, []);

    const handleLogout = async () => {
        await fetch('/api/auth/login', { method: 'DELETE' });
        router.push('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Package size={18} color="white" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <h1 style={{ whiteSpace: 'normal', lineHeight: 1.2, fontSize: 13, wordBreak: 'break-word' }}>{schoolName}</h1>
                        <p>Sarana & Prasarana</p>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section}>
                        <p className="nav-section-label">{section.section}</p>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={17} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div style={{
                padding: '8px 12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex', flexDirection: 'column', gap: 2,
            }}>
                <Link
                    href="/"
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'none', color: 'var(--text-secondary)', fontSize: 13.5,
                        transition: 'background 0.15s',
                        textDecoration: 'none'
                    }}
                >
                    <Home size={15} style={{ color: '#10B981' }} />
                    <span>Kembali ke Portal</span>
                </Link>

                <button
                    onClick={toggleTheme}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'none', color: 'var(--text-secondary)', fontSize: 13.5,
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    {theme === 'dark' ? <Sun size={15} style={{ color: '#F59E0B' }} /> : <Moon size={15} style={{ color: '#6366F1' }} />}
                    <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>

                <button
                    onClick={handleLogout}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: 'none', color: 'var(--text-muted)', fontSize: 13.5,
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    <LogOut size={15} style={{ color: '#EF4444' }} />
                    <span>Keluar</span>
                </button>
            </div>

            <div style={{
                padding: '10px 16px 14px',
                fontSize: 11,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
            }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>SiSarpras v1.0</div>
                <div>Sistem Informasi Sarpras</div>
            </div>
        </aside>
    );
}
