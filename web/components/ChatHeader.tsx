'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Trash2, Check, X, StickyNote, Workflow, Bookmark, ChevronDown, Menu } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Modal } from './Modal';
import { useSidebar } from './SidebarContext';

interface ChatHeaderProps {
    title: string;
    onRename: (newTitle: string) => void;
    onDelete: () => void;
    onAddNote: () => void;
    onAddDiagram: () => void;
    savedQueries?: { name?: string; content: string; scope?: 'session' | 'general' }[];
    onSelectQuery?: (sql: string) => void;
    onDeleteQuery?: (name: string, scope?: 'session' | 'general') => void;
}

export function ChatHeader({ title, onRename, onDelete, onAddNote, onAddDiagram, savedQueries = [], onSelectQuery, onDeleteQuery }: ChatHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQueriesOpen, setIsQueriesOpen] = useState(false);
    const [hoveredQueryIdx, setHoveredQueryIdx] = useState<number | null>(null);
    const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
    const [mounted, setMounted] = useState(false);
    const { toggleMobile } = useSidebar();

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        setEditedTitle(title);
    }, [title]);

    const handleSave = () => {
        if (editedTitle.trim()) {
            onRename(editedTitle.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditedTitle(title);
        setIsEditing(false);
    };

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        onDelete();
        setIsDeleteModalOpen(false);
    };

    const getScopeHoverClass = (scope?: string) => {
        return scope === 'general' ? 'hover:bg-purple-600/10' : 'hover:bg-slate-800';
    };


    return (
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0 z-40">
            <div className="flex-1 flex items-center gap-2 lg:gap-4 mr-2 lg:mr-4">
                <button 
                    onClick={toggleMobile}
                    className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    title="Open sidebar"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Saved Queries Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsQueriesOpen(!isQueriesOpen)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-slate-700 hover:border-slate-600 min-w-[140px] justify-between"
                    >
                        <div className="flex items-center gap-2">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>Queries</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isQueriesOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isQueriesOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsQueriesOpen(false)} />
                            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                {savedQueries.length === 0 ? (
                                    <div className="px-4 py-3 text-xs text-slate-500 text-center italic">
                                        No saved queries yet
                                    </div>
                                ) : (
                                    <div className="max-h-[70vh] overflow-y-auto">
                                        {savedQueries.map((q, idx) => (
                                            <div
                                                key={`${q.scope}-${idx}`}
                                                className={`relative group ${getScopeHoverClass(q.scope)} transition-colors`}
                                                onMouseEnter={(e) => {
                                                    setHoveredQueryIdx(idx);
                                                    setHoveredRect(e.currentTarget.getBoundingClientRect());
                                                }}
                                                onMouseLeave={() => {
                                                    setHoveredQueryIdx(null);
                                                    setHoveredRect(null);
                                                }}
                                            >
                                                <div className="flex items-center min-w-0">
                                                    <button
                                                        onClick={() => {
                                                            onSelectQuery?.(q.content);
                                                            setIsQueriesOpen(false);
                                                        }}
                                                        className="flex-1 text-left px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors flex items-center gap-2 min-w-0"
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${q.scope === 'general' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                                                        <span className="truncate flex-1">{q.name}</span>
                                                        {q.scope === 'general' && (
                                                            <span className="shrink-0 text-[8px] bg-purple-500/20 text-purple-400 px-1 rounded uppercase tracking-tighter">Global</span>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteQuery?.(q.name || '', q.scope);
                                                        }}
                                                        className="shrink-0 px-2 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                        title="Delete saved query"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {hoveredQueryIdx === idx && mounted && hoveredRect && createPortal(
                                                    <div 
                                                        style={{
                                                            position: 'fixed',
                                                            left: `${hoveredRect.right + 8}px`,
                                                            top: `${hoveredRect.top}px`,
                                                            zIndex: 9999
                                                        }}
                                                        className="w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl p-4 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                                                    >
                                                        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2">Query Preview</div>
                                                        <div className="max-h-60 overflow-hidden rounded-md border border-slate-800 bg-slate-950">
                                                            <SyntaxHighlighter
                                                                language="sql"
                                                                style={vscDarkPlus}
                                                                customStyle={{ margin: 0, padding: '12px', background: 'transparent', fontSize: '11px' }}
                                                                wrapLongLines
                                                            >
                                                                {q.content}
                                                            </SyntaxHighlighter>
                                                        </div>
                                                    </div>,
                                                    document.body
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="h-4 w-px bg-slate-800" />
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                        <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                        <button
                            onClick={handleSave}
                            className="p-1.5 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-md transition-colors"
                            title="Save"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-md transition-colors"
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 group overflow-hidden">
                        <h2
                            className="text-white font-medium truncate cursor-text opacity-90 group-hover:opacity-100 transition-opacity"
                            onClick={() => setIsEditing(true)}
                            title="Click to rename"
                        >
                            {title}
                        </h2>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-slate-500 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-slate-800 rounded-md"
                            title="Rename session"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className="h-4 w-px bg-slate-800 mx-2" />
                <button
                    onClick={handleDeleteClick}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 p-2 rounded-md transition-all duration-200 group relative"
                    title="Delete session"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-slate-800 mx-2" />
                <button
                    onClick={onAddNote}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 lg:px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
                >
                    <StickyNote className="w-4 h-4" />
                    <span className="hidden sm:inline">Note</span>
                </button>
                <button
                    onClick={onAddDiagram}
                    className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 lg:px-3 py-1.5 rounded-md text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
                >
                    <Workflow className="w-4 h-4" />
                    <span className="hidden sm:inline">Diagram</span>
                </button>
            </div>


            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Session"
            >
                <div className="space-y-4">
                    <p className="text-slate-300">
                        Are you sure you want to delete this session? This action cannot be undone.
                    </p>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDelete}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors font-medium"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div >
    );
}
