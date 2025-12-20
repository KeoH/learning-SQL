'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, Database, MessageSquare, ChevronLeft, LayoutPanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/date';
import { Modal } from './Modal';
import { useSidebar } from './SidebarContext';

// Replicating type for client
type SessionData = {
    id: string;
    name: string;
    timestamp: number;
};

export function Sidebar() {
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [databases, setDatabases] = useState<string[]>([]);
    const [newSessionName, setNewSessionName] = useState('');
    const [selectedDb, setSelectedDb] = useState('learning_db');
    const router = useRouter();
    const pathname = usePathname();

    const { isCollapsed, toggle, isMobileOpen, setIsMobileOpen } = useSidebar();

    const fetchDatabases = async () => {
        try {
            const res = await fetch('/api/databases');
            const data = await res.json();
            setDatabases(data);
        } catch (error) {
            console.error('Failed to load databases', error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            setSessions(data);
        } catch (error) {
            console.error('Failed to load sessions', error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchSessions();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchDatabases();
        // Close mobile sidebar on route change
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMobileOpen(false);
    }, [pathname, setIsMobileOpen]);

    const handleCreateSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSessionName) return;

        try {
            const res = await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSessionName, database: selectedDb }),
            });
            const data = await res.json();
            if (data.id) {
                router.push(`/session/${data.id}`);
                setNewSessionName('');
                setIsModalOpen(false);
                fetchSessions();
            }
        } catch (error) {
            console.error('Failed to create session', error);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <div className={cn(
                "bg-slate-900 border-r border-slate-800 flex flex-col h-screen transition-all duration-300 ease-in-out z-50",
                // Desktop sizing
                isCollapsed ? "w-20" : "w-64",
                // Mobile sizing and positioning
                "fixed inset-y-0 left-0 lg:relative lg:translate-x-0",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className={cn(
                    "p-4 border-b border-slate-800 flex items-center justify-between min-h-[64px]",
                    isCollapsed ? "px-2" : "px-4"
                )}>
                    <div className={cn(
                        "flex items-center gap-3 transition-opacity duration-300",
                        isCollapsed ? "w-full justify-center" : "flex-1"
                    )}>
                        <div className="p-2 bg-blue-600 rounded-lg shrink-0">
                            <Database className="w-5 h-5 text-white" />
                        </div>
                        {!isCollapsed && (
                            <h1 className="font-bold text-lg tracking-tight text-white truncate animate-in fade-in duration-500">
                                SQL Playground
                            </h1>
                        )}
                    </div>
                    
                    {/* Toggle Button for Desktop */}
                    <button 
                        onClick={toggle}
                        className="hidden lg:flex p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {isCollapsed ? <LayoutPanelLeft className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>

                    {/* Close Button for Mobile */}
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all font-medium text-sm",
                            isCollapsed ? "p-3 h-12" : "py-2.5 px-4 h-11"
                        )}
                        title="New Session"
                    >
                        <Plus className="w-5 h-5" />
                        {!isCollapsed && <span className="animate-in fade-in">New Session</span>}
                    </button>
                </div>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Create New Session"
                >
                    <form onSubmit={handleCreateSession} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Session Name
                            </label>
                            <input
                                type="text"
                                value={newSessionName}
                                onChange={(e) => setNewSessionName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="My SQL Practice"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">
                                Database
                            </label>
                            <select
                                value={selectedDb}
                                onChange={(e) => setSelectedDb(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {databases.map((db) => (
                                    <option key={db} value={db}>
                                        {db}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors font-medium"
                            >
                                Create
                            </button>
                        </div>
                    </form>
                </Modal>

                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                    {sessions.map((session) => (
                        <Link
                            key={session.id}
                            href={`/session/${session.id}`}
                            className={cn(
                                "flex items-center gap-3 rounded-md text-sm transition-all duration-200 group relative",
                                isCollapsed ? "justify-center p-3" : "px-3 py-3",
                                pathname === `/session/${session.id}`
                                    ? "bg-slate-800 text-white shadow-sm"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            )}
                            title={isCollapsed ? session.name : undefined}
                        >
                            <MessageSquare className={cn(
                                "shrink-0 transition-all",
                                isCollapsed ? "w-5 h-5" : "w-4 h-4 opacity-70 group-hover:opacity-100"
                            )} />
                            {!isCollapsed && (
                                <div className="flex flex-col min-w-0 animate-in fade-in duration-300">
                                    <span className="truncate">{session.name}</span>
                                    <span className="text-xs text-slate-500">{formatRelativeTime(session.timestamp)}</span>
                                </div>
                            )}
                            {isCollapsed && pathname === `/session/${session.id}` && (
                                <div className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full" />
                            )}
                        </Link>
                    ))}
                    {sessions.length === 0 && (
                        <div className="text-center text-slate-600 text-xs py-10">
                            {!isCollapsed ? "No sessions yet." : "..."}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
