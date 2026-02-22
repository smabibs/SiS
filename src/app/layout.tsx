import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
    title: "Portal Sekolah - Sistem Informasi Terpadu",
    description: "Sistem Informasi Terpadu (Lab, Sarpras, Perpus)",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id" data-theme="dark" suppressHydrationWarning>
            <body>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
