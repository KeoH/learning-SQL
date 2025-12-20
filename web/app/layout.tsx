import type { Metadata } from 'next';
import { Inter, Ubuntu_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });
const ubuntuMono = Ubuntu_Mono({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-ubuntu-mono',
});

export const metadata: Metadata = {
    title: 'Learning SQL',
    description: 'Interactive SQL Learning App',
};

import { SidebarProvider } from '@/components/SidebarContext';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`${inter.className} ${ubuntuMono.variable}`}>
                <SidebarProvider>
                    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
                        <Sidebar />
                        <main className="flex-1 overflow-hidden relative flex flex-col">
                            {children}
                        </main>
                    </div>
                </SidebarProvider>
            </body>
        </html>
    );
}
