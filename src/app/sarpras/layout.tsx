'use client';

import SarprasSidebar from '@/components/SarprasSidebar';

export default function SarprasLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-layout">
            <SarprasSidebar />
            <div className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
