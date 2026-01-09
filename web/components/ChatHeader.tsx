'use client';

import { useState, useEffect } from 'react';
import { Pencil, Trash2, Check, X, StickyNote, Workflow, Bookmark, Menu } from 'lucide-react';
import { Modal } from './Modal';
import { SavedQueriesModal } from './SavedQueriesModal';
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
    onSaveQuery?: (name: string, content: string, scope: 'session' | 'general') => void;
}

export function ChatHeader({ 
    title, 
    onRename, 
    onDelete, 
    onAddNote, 
    onAddDiagram, 
    savedQueries = [], 
    onSelectQuery, 
    onDeleteQuery,
    onSaveQuery
}: ChatHeaderProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isQueriesModalOpen, setIsQueriesModalOpen] = useState(false);
    const { toggleMobile } = useSidebar();


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

                {/* Saved Queries Trigger */}
                <div className="relative">
                    <button
                        onClick={() => setIsQueriesModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-slate-700 hover:border-slate-600 min-w-[120px] justify-center"
                    >
                        <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                        <span>Saved Queries</span>
                    </button>
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

            <SavedQueriesModal
                isOpen={isQueriesModalOpen}
                onClose={() => setIsQueriesModalOpen(false)}
                savedQueries={savedQueries}
                onSelectQuery={onSelectQuery || (() => {})}
                onDeleteQuery={onDeleteQuery || (() => {})}
                onSaveQuery={onSaveQuery || (() => {})}
            />
        </div >
    );
}
