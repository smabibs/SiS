'use client';

import Sidebar from '@/components/Sidebar';

export default function LabLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
