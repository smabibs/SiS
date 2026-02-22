'use client';

import Link from 'next/link';
import { Microscope, Package, Library, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PortalPage() {
    const router = useRouter();

    const handleLogout = async () => {
        await fetch('/api/auth/login', { method: 'DELETE' });
        router.push('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            padding: 40,
            backgroundImage: 'radial-gradient(ellipse at top, rgba(13,148,136,0.1), transparent 50%)'
        }}>
            <div style={{
                maxWidth: 1000,
                width: '100%',
                margin: '0 auto',
            }}>
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 60
                }}>
                    <div>
                        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Portal Aplikasi Sekolah</h1>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Silakan pilih modul aplikasi yang ingin diakses.</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 16px',
                            borderRadius: 12,
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: 14,
                            fontWeight: 600,
                            transition: 'all 0.2s',
                        }}
                    >
                        <LogOut size={16} style={{ color: '#ef4444' }} />
                        Keluar
                    </button>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 30
                }}>
                    {/* Lab IPA */}
                    <Link href="/lab" style={{ textDecoration: 'none' }}>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 24,
                            padding: 32,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = '#10B981';
                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(16,185,129,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            }}
                        >
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #0D9488, #10B981)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Microscope size={32} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>Lab IPA</h2>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                    Sistem Manajemen Informasi Laboratorium IPA. Kelola inventaris alat, bahan, dan peminjaman laboratorium.
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Sarpras */}
                    <Link href="/sarpras" style={{ textDecoration: 'none' }}>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 24,
                            padding: 32,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = '#8B5CF6';
                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(139,92,246,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            }}
                        >
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #7C3AED, #8B5CF6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Package size={32} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>Sarpras</h2>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                    Sistem Informasi Sarana dan Prasarana Sekolah. Kelola ruangan, fasilitas, dan barang inventaris sekolah.
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Perpustakaan */}
                    <Link href="/perpus" style={{ textDecoration: 'none' }}>
                        <div style={{
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 24,
                            padding: 32,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 20,
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.borderColor = '#3B82F6';
                                e.currentTarget.style.boxShadow = '0 10px 40px rgba(59,130,246,0.15)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
                            }}
                        >
                            <div style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #2563EB, #3B82F6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Library size={32} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>Perpustakaan</h2>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                    Sistem Informasi Manajemen Perpustakaan. Kelola buku, peminjaman, anggota, dan denda.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
