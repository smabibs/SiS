'use client';

import PerpusSidebar from '@/components/PerpusSidebar';

export default function PerpusLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="app-layout">
            <PerpusSidebar />
            <div className="main-content">
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
