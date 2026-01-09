'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Edit2, Check, Bookmark, Clock, Globe } from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SavedQuery {
    name?: string;
    content: string;
    scope?: 'session' | 'general';
}

interface SavedQueriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedQueries: SavedQuery[];
    onSelectQuery: (sql: string) => void;
    onDeleteQuery: (name: string, scope?: 'session' | 'general') => void;
    onSaveQuery: (name: string, content: string, scope: 'session' | 'general') => void;
}

export function SavedQueriesModal({
    isOpen,
    onClose,
    savedQueries,
    onSelectQuery,
    onDeleteQuery,
    onSaveQuery
}: SavedQueriesModalProps) {
    const [scope, setScope] = useState<'session' | 'general'>('session');
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [newName, setNewName] = useState('');
    const [newSql, setNewSql] = useState('');

    const filteredQueries = useMemo(() => {
        return savedQueries
            .filter(q => (q.scope || 'session') === scope)
            .filter(q => 
                (q.name || '').toLowerCase().includes(search.toLowerCase()) ||
                q.content.toLowerCase().includes(search.toLowerCase())
            );
    }, [savedQueries, scope, search]);

    const handleStartAdd = () => {
        setIsAdding(true);
        setNewName('');
        setNewSql('');
    };

    const handleStartEdit = (index: number, query: SavedQuery) => {
        setEditingIndex(index);
        setNewName(query.name || '');
        setNewSql(query.content);
    };

    const handleSave = () => {
        if (!newSql.trim()) return;
        onSaveQuery(newName.trim() || 'Untitled Query', newSql, scope);
        setIsAdding(false);
        setEditingIndex(null);
        setNewName('');
        setNewSql('');
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingIndex(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Saved Queries"
            className="max-w-4xl h-[80vh] flex flex-col"
        >
            <div className="flex flex-col h-full space-y-4">
                {/* Tabs and Search */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex bg-slate-800 p-1 rounded-lg self-start">
                        <button
                            onClick={() => setScope('session')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                scope === 'session' ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Clock className="w-4 h-4" />
                            Local
                        </button>
                        <button
                            onClick={() => setScope('general')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                                scope === 'general' ? "bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                            )}
                        >
                            <Globe className="w-4 h-4" />
                            General
                        </button>
                    </div>

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search queries..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                    </div>
                </div>

                {/* Query List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {isAdding ? (
                        <div className="bg-slate-800/50 border border-indigo-500/50 rounded-xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Query Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Enter query name..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SQL Content</label>
                                <textarea
                                    value={newSql}
                                    onChange={(e) => setNewSql(e.target.value)}
                                    placeholder="SELECT * FROM..."
                                    rows={4}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCancel}
                                    className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <Check className="w-4 h-4" />
                                    Save Query
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartAdd}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 rounded-xl text-slate-400 hover:text-indigo-400 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="font-semibold">Add New Query</span>
                        </button>
                    )}

                    {filteredQueries.map((query, idx) => {
                        const isEditing = editingIndex === idx;
                        return (
                            <div
                                key={`${query.name}-${idx}`}
                                className={cn(
                                    "group bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden transition-all hover:border-slate-600",
                                    isEditing && "border-indigo-500/50 ring-1 ring-indigo-500/20"
                                )}
                            >
                                {isEditing ? (
                                    <div className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <textarea
                                                value={newSql}
                                                onChange={(e) => setNewSql(e.target.value)}
                                                rows={4}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={handleCancel}
                                                className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                                Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/30">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    scope === 'session' ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                                                )}>
                                                    <Bookmark className="w-4 h-4" />
                                                </div>
                                                <h4 className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                                                    {query.name || 'Untitled Query'}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleStartEdit(idx, query)}
                                                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
                                                    title="Edit query"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteQuery(query.name || '', scope)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                                    title="Delete query"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="w-px h-4 bg-slate-700 mx-1" />
                                                <button
                                                    onClick={() => {
                                                        onSelectQuery(query.content);
                                                        onClose();
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                                                >
                                                    Use Query
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative group/code">
                                            <div className="overflow-hidden">
                                                <SyntaxHighlighter
                                                    language="sql"
                                                    style={vscDarkPlus}
                                                    customStyle={{
                                                        margin: 0,
                                                        padding: '1rem',
                                                        fontSize: '0.8rem',
                                                        backgroundColor: 'transparent'
                                                    }}
                                                >
                                                    {query.content}
                                                </SyntaxHighlighter>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {filteredQueries.length === 0 && !isAdding && (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                            <Bookmark className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-sm font-medium">No queries found in {scope} scope.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
