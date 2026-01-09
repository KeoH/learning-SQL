'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Terminal as TerminalIcon, User, Database, AlertCircle, StickyNote, Pencil, Trash2, AlertTriangle, Bold, Italic, Link as LinkIcon, ImageIcon, List, ListOrdered, Code, Quote, Heading, Copy, Bookmark, ChevronLeft, ChevronRight, Hash, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChatHeader } from '@/components/ChatHeader';
import { Modal } from '@/components/Modal';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';
import 'prismjs/themes/prism-tomorrow.css'; // Use a valid theme
import { MermaidRender } from '@/components/MermaidRender';
import { Workflow } from 'lucide-react';

interface ChatInterfaceProps {
    sessionId: string;
}

interface parsedMessage {
    type: 'query' | 'result' | 'error' | 'note' | 'mermaid' | 'saved-query' | 'page-break';
    content: string;
    raw: string;
    name?: string; // For saved queries
    scope?: 'session' | 'general'; // New field for saved queries
}

// Simple parser to split the markdown file into messages
const parseMarkdown = (md: string, scope: 'session' | 'general' = 'session'): parsedMessage[] => {
    // Only split on standard headers: Query, Result, Error, Note, Diagram, Page Break
    // Use lookahead to keep the delimiter 
    const parts = md.split(/^## (?=Query|Result|Error|Note|Diagram|Saved Query|Page Break)/gm);
    const messages: parsedMessage[] = [];

    parts.forEach(part => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return;

        if (trimmedPart.startsWith('Query')) {
            // Extract content inside ```sql ... ```
            const content = trimmedPart.replace('Query', '').trim();
            const sqlMatch = content.match(/```sql([\s\S]*?)```/);
            const cleanContent = sqlMatch ? sqlMatch[1].trim() : content;

            messages.push({ type: 'query', content: cleanContent, raw: part });
        } else if (trimmedPart.startsWith('Result')) {
            const content = trimmedPart.replace('Result', '').trim();
            messages.push({ type: 'result', content, raw: part });
        } else if (trimmedPart.startsWith('Error')) {
            const content = trimmedPart.replace('Error', '').trim();
            // Clean error code block markers
            const errMatch = content.match(/```([\s\S]*?)```/);
            const cleanContent = errMatch ? errMatch[1].trim() : content;
            messages.push({ type: 'error', content: cleanContent, raw: part });
        } else if (trimmedPart.startsWith('Note')) {
            const content = trimmedPart.replace('Note', '').trim();
            messages.push({ type: 'note', content, raw: part });
        } else if (trimmedPart.startsWith('Diagram')) {
            const content = trimmedPart.replace('Diagram', '').trim();
            messages.push({ type: 'mermaid', content, raw: part });
        } else if (trimmedPart.startsWith('Saved Query')) {
            // Format: Saved Query\n[Name]\n```sql\n[SQL]\n```
            const lines = trimmedPart.split('\n').map(l => l.trim()).filter(l => l !== '');
            const name = lines[1] || 'Untitled Query';
            const sqlMatch = trimmedPart.match(/```sql([\s\S]*?)```/);
            const content = sqlMatch ? sqlMatch[1].trim() : '';
            messages.push({ type: 'saved-query', content, raw: part, name, scope });
        } else if (trimmedPart.startsWith('Page Break')) {
            messages.push({ type: 'page-break', content: 'Page Break', raw: part });
        }
    });
    return messages;
};

export function ChatInterface({ sessionId }: ChatInterfaceProps) {
    const [input, setInput] = useState('');
    const [parsedMessages, setParsedMessages] = useState<parsedMessage[]>([]);
    const [generalMessages, setGeneralMessages] = useState<parsedMessage[]>([]);
    const [currentPage, setCurrentPage] = useState(0);

    const paginatedMessages = useMemo(() => {
        if (parsedMessages.length === 0) return [[]];
        const pages: parsedMessage[][] = [[]];
        let currentPageIndex = 0;
        parsedMessages.forEach(msg => {
            if (msg.type === 'page-break') {
                pages.push([]);
                currentPageIndex++;
            } else {
                pages[currentPageIndex].push(msg);
            }
        });
        return pages;
    }, [parsedMessages]);

    // Handle initial load and page additions
    useEffect(() => {
        if (paginatedMessages.length > 0) {
            setCurrentPage(paginatedMessages.length - 1);
        }
    }, [sessionId, paginatedMessages.length]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState('');
    const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
    const [sendingNote, setSendingNote] = useState(false);
    const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Diagram State
    const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
    const [diagramContent, setDiagramContent] = useState('');
    const [editingDiagramIndex, setEditingDiagramIndex] = useState<number | null>(null);
    const [sendingDiagram, setSendingDiagram] = useState(false);
    const diagramTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Deletion State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingNoteIndex, setDeletingNoteIndex] = useState<number | null>(null);
    const [deletingScope, setDeletingScope] = useState<'session' | 'general'>('session');
    const [isDeleting, setIsDeleting] = useState(false);
    // Saving Query State
    const [isSaveQueryModalOpen, setIsSaveQueryModalOpen] = useState(false);
    const [queryToSave, setQueryToSave] = useState('');
    const [savedQueryName, setSavedQueryName] = useState('');
    const [isSavingQuery, setIsSavingQuery] = useState(false);
    const [saveScope, setSaveScope] = useState<'session' | 'general'>('session');

    const bottomRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchHistory = useCallback(async () => {
        try {
            // Fetch session history
            const res = await fetch(`/api/history/${sessionId}`);
            const data = await res.json();
            
            // Fetch general queries
            const gRes = await fetch(`/api/history/general`);
            const gData = await gRes.json();

            if (data.content) {
                const firstLine = data.content.split('\n')[0];
                const cleanTitle = firstLine.startsWith('# ') ? firstLine.substring(2) : sessionId;
                setTitle(cleanTitle);

                const sessionMessages = parseMarkdown(data.content, 'session');
                const generalMessages = gData.content ? parseMarkdown(gData.content, 'general') : [];

                setParsedMessages(sessionMessages);
                setGeneralMessages(generalMessages);
            }
        } catch (error) {
            console.error('Failed to load history', error);
        }
    }, [sessionId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [currentPage, paginatedMessages]);

    const executeQuery = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const sql = input.trim();
        setInput('');
        setLoading(true);

        // Optimistic UI
        setParsedMessages(prev => [...prev, { type: 'query', content: sql, raw: '' }]);

        try {
            const res = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql, sessionId }),
            });

            const data = await res.json();

            // We could use data.markdown directly, but re-fetching ensures we are in sync with file
            // and simplifies the "Result" parsing logic which expects the markdown format.
            // However, to avoid waiting, we can manually append.
            if (data.markdown) {
                setParsedMessages(prev => [...prev, { type: 'result', content: data.markdown, raw: '' }]);
            } else if (data.error) {
                setParsedMessages(prev => [...prev, { type: 'error', content: data.error, raw: '' }]);
            }

            // Re-fetch in background to ensure consistency (e.g. backend-inserted page breaks)
            fetchHistory(); 
        } catch (error: unknown) {
            console.error('Failed to execute query', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setParsedMessages(prev => [...prev, { type: 'error', content: errorMessage, raw: '' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            executeQuery();
        }
    };

    const handleRename = async (newTitle: string) => {
        try {
            const res = await fetch(`/api/history/${sessionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newTitle }),
            });
            if (res.ok) {
                setTitle(newTitle);
                // Force sidebar refresh (hacky way: using window.location or we need a context)
                // For now, let's just update local state. Sidebar will update next time user navigates.
            }
        } catch (error) {
            console.error('Failed to rename session', error);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/history/${sessionId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.push('/');
                // Optionally trigger a sidebar refresh here too
            }
        } catch (error) {
            console.error('Failed to delete session', error);
        }
    };

    const handleOpenAddNote = () => {
        setEditingNoteIndex(null);
        setNoteContent('');
        setIsNoteModalOpen(true);
    };

    const handleOpenAddDiagram = () => {
        setEditingDiagramIndex(null);
        setDiagramContent('graph TD\n  A[Start] --> B{Decision}\n  B -- Yes --> C[Result 1]\n  B -- No --> D[Result 2]');
        setIsDiagramModalOpen(true);
    };

    const handleEditNote = (index: number, content: string) => {
        setEditingNoteIndex(index);
        setNoteContent(content);
        setIsNoteModalOpen(true);
        // Focus textarea after a short delay
        setTimeout(() => {
            noteTextareaRef.current?.focus();
        }, 100);
    };

    const handleEditDiagram = (index: number, content: string) => {
        setEditingDiagramIndex(index);
        setDiagramContent(content);
        setIsDiagramModalOpen(true);
        // Focus textarea after a short delay
        setTimeout(() => {
            diagramTextareaRef.current?.focus();
        }, 100);
    };

    const insertText = (before: string, after: string = '') => {
        const textarea = noteTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const newText = text.substring(0, start) + before + text.substring(start, end) + after + text.substring(end);

        setNoteContent(newText);

        const newCursorPos = start + before.length;

        // Restore focus and cursor
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos + (end - start));
        }, 0);
    };

    const handleBold = () => insertText('**', '**');
    const handleItalic = () => insertText('*', '*');
    const handleLink = () => insertText('[', '](url)');
    const handleImage = () => insertText('![alt text](', ')');
    const handleUnorderedList = () => insertText('- ');
    const handleOrderedList = () => insertText('1. ');
    const handleCodeBlock = () => insertText('```\n', '\n```');
    const handleQuote = () => insertText('> ');
    const handleHeading = () => insertText('## ');

    const handleSendNote = async () => {
        if (!noteContent.trim()) return;
        setSendingNote(true);

        try {
            if (editingNoteIndex !== null) {
                // Edit existing note
                const res = await fetch(`/api/history/${sessionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: editingNoteIndex, content: noteContent }),
                });

                if (res.ok) {
                    setParsedMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs[editingNoteIndex]) {
                            newMsgs[editingNoteIndex] = { ...newMsgs[editingNoteIndex], content: noteContent };
                        }
                        return newMsgs;
                    });
                    setNoteContent('');
                    setEditingNoteIndex(null);
                    setIsNoteModalOpen(false);
                }
            } else {
                // Add new note
                const res = await fetch(`/api/history/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'note', content: noteContent }),
                });
                if (res.ok) {
                    setParsedMessages(prev => [...prev, { type: 'note', content: noteContent, raw: '' }]);
                    setNoteContent('');
                    setIsNoteModalOpen(false);
                }
            }
        } catch (error) {
            console.error('Failed to save note', error);
        } finally {
            setSendingNote(false);
        }
    };

    const handleSendDiagram = async () => {
        if (!diagramContent.trim()) return;
        setSendingDiagram(true);

        try {
            if (editingDiagramIndex !== null) {
                // Edit existing diagram
                const res = await fetch(`/api/history/${sessionId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: editingDiagramIndex, content: diagramContent }),
                });

                if (res.ok) {
                    setParsedMessages(prev => {
                        const newMsgs = [...prev];
                        if (newMsgs[editingDiagramIndex]) {
                            newMsgs[editingDiagramIndex] = { ...newMsgs[editingDiagramIndex], content: diagramContent };
                        }
                        return newMsgs;
                    });
                    setDiagramContent('');
                    setEditingDiagramIndex(null);
                    setIsDiagramModalOpen(false);
                }
            } else {
                // Add new diagram
                const res = await fetch(`/api/history/${sessionId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'mermaid', content: diagramContent }),
                });
                if (res.ok) {
                    setParsedMessages(prev => [...prev, { type: 'mermaid', content: diagramContent, raw: '' }]);
                    setDiagramContent('');
                    setIsDiagramModalOpen(false);
                }
            }
        } catch (error) {
            console.error('Failed to save diagram', error);
        } finally {
            setSendingDiagram(false);
        }
    };

    const handleOpenDeleteConfirm = (index: number, scope: 'session' | 'general' = 'session') => {
        setDeletingNoteIndex(index);
        setDeletingScope(scope);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (deletingNoteIndex === null) return;
        setIsDeleting(true);
        try {
            const endpoint = deletingScope === 'general' ? '/api/history/general' : `/api/history/${sessionId}`;
            const finalIndex = deletingNoteIndex;

            const res = await fetch(`${endpoint}?index=${finalIndex}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                // Refresh full history to ensure indices sync up
                await fetchHistory();
                setIsDeleteModalOpen(false);
                setDeletingNoteIndex(null);
            }
        } catch (error) {
            console.error('Failed to delete note', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCopyToInput = (content: string) => {
        setInput(content);
        // Focus the editor
        const editor = document.getElementById('sql-input-editor');
        editor?.focus();
    };

    const handleOpenSaveQuery = (content: string) => {
        setQueryToSave(content);
        setSavedQueryName('');
        setIsSaveQueryModalOpen(true);
    };

    const handleConfirmSaveQuery = async () => {
        if (!savedQueryName.trim() || !queryToSave.trim()) return;
        setIsSavingQuery(true);
        try {
            const formattedContent = `${savedQueryName}\n\`\`\`sql\n${queryToSave}\n\`\`\``;
            const endpoint = saveScope === 'general' ? '/api/history/general' : `/api/history/${sessionId}`;
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'saved-query', content: formattedContent }),
            });
            if (res.ok) {
                await fetchHistory();
                setIsSaveQueryModalOpen(false);
            }
        } catch (error) {
            console.error('Failed to save query', error);
        } finally {
            setIsSavingQuery(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-950 font-sans">
            <ChatHeader
                title={title}
                onRename={handleRename}
                onDelete={handleDelete}
                onAddNote={handleOpenAddNote}
                onAddDiagram={handleOpenAddDiagram}
                savedQueries={[
                    ...parsedMessages.filter(m => m.type === 'saved-query'),
                    ...generalMessages.filter(m => m.type === 'saved-query')
                ]}
                onSelectQuery={handleCopyToInput}
                onDeleteQuery={(name: string, scope?: 'session' | 'general') => {
                    const targetList = scope === 'general' ? generalMessages : parsedMessages;
                    const idx = targetList.findIndex(m => m.type === 'saved-query' && m.name === name);
                    if (idx !== -1) handleOpenDeleteConfirm(idx, scope || 'session');
                }}
                onSaveQuery={async (name, content, scope) => {
                    const formattedContent = `${name}\n\`\`\`sql\n${content}\n\`\`\``;
                    const endpoint = scope === 'general' ? '/api/history/general' : `/api/history/${sessionId}`;
                    
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'saved-query', content: formattedContent }),
                    });
                    if (res.ok) {
                        await fetchHistory();
                    }
                }}
            />
            {/* Pagination Controls */}
            {paginatedMessages.length > 1 && (
                <div className="flex items-center justify-between px-6 py-3 bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                                disabled={currentPage === 0}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Previous Page"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center px-4 gap-2 border-x border-slate-700/50 mx-1">
                                <Hash className="w-4 h-4 text-blue-500/70" />
                                <span className="text-sm font-bold text-slate-200 tabular-nums">
                                    {currentPage + 1} <span className="text-slate-500 font-medium">/ {paginatedMessages.length}</span>
                                </span>
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(paginatedMessages.length - 1, prev + 1))}
                                disabled={currentPage === paginatedMessages.length - 1}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/80 rounded-md transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Next Page"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-widest bg-slate-800/30 px-3 py-1.5 rounded-full border border-slate-700/30">
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Session Browser</span>
                    </div>
                </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
                {paginatedMessages.length === 0 || (paginatedMessages[currentPage] && paginatedMessages[currentPage].length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-[80vh] text-slate-500 opacity-50 select-none">
                        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
                            <TerminalIcon className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-medium">Start conversational SQL...</p>
                    </div>
                ) : (
                    paginatedMessages[currentPage]?.map((msg, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.type === 'query' ? "flex-row-reverse" : "flex-row"
                            )}
                        >
                            {/* Avatar */}
                            <div className={cn(
                                "shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm mt-1",
                                msg.type === 'query'
                                    ? "bg-blue-600/20 border-blue-500/30 text-blue-400"
                                    : msg.type === 'error'
                                        ? "bg-red-600/20 border-red-500/30 text-red-400"
                                        : msg.type === 'note'
                                            ? "bg-amber-500/20 border-amber-500/30 text-amber-400"
                                            : msg.type === 'mermaid'
                                                ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400"
                                                : "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                            )}>
                                {msg.type === 'query' && <User className="w-4 h-4" />}
                                {msg.type === 'result' && <Database className="w-4 h-4" />}
                                {msg.type === 'error' && <AlertCircle className="w-4 h-4" />}
                                {msg.type === 'note' && <StickyNote className="w-4 h-4" />}
                                {msg.type === 'mermaid' && <Workflow className="w-4 h-4" />}
                                {msg.type === 'saved-query' && <Bookmark className="w-4 h-4" />}
                            </div>

                            {/* Content Bubble */}
                            <div className={cn(
                                "flex flex-col",
                                (msg.type === 'note' || msg.type === 'mermaid') ? "w-full" : "max-w-[85%] md:max-w-[75%]",
                                msg.type === 'query' ? "items-end" : ((msg.type === 'note' || msg.type === 'mermaid') ? "items-stretch" : "items-start")
                            )}>
                                {/* Header */}
                                <div className="text-xs font-mono text-slate-500 mb-1 px-1">
                                    {msg.type === 'query' ? 'You' : msg.type === 'error' ? 'System Error' : msg.type === 'note' ? 'Your Note' : msg.type === 'mermaid' ? 'Diagram' : msg.type === 'saved-query' ? 'Saved Query' : 'Postgres Result'}
                                </div>

                                <div className={cn(
                                    "rounded-2xl shadow-md border overflow-hidden relative group font-(family-name:--font-ubuntu-mono)",
                                    msg.type === 'note' ? "px-8 py-8 text-lg" : "px-5 py-4 text-lg",
                                    msg.type === 'query'
                                        ? "bg-blue-600/10 border-blue-500/20 text-slate-200 rounded-tr-sm"
                                        : msg.type === 'error'
                                            ? "bg-red-950/30 border-red-500/20 text-red-200 rounded-tl-sm w-full"
                                            : msg.type === 'note'
                                                ? "bg-amber-950/30 border-amber-500/20 text-amber-100 rounded-tl-sm w-full"
                                                : msg.type === 'saved-query'
                                                    ? (msg.scope === 'general' 
                                                        ? "bg-purple-950/30 border-purple-500/20 text-purple-100 rounded-tl-sm w-full shadow-lg shadow-purple-500/5"
                                                        : "bg-emerald-950/30 border-emerald-500/20 text-emerald-100 rounded-tl-sm w-full")
                                                    : "bg-slate-900 border-slate-800 text-slate-300 rounded-tl-sm w-full"
                                )}>
                                    {msg.type === 'query' ? (
                                        <>
                                            <SyntaxHighlighter
                                                language="sql"
                                                style={vscDarkPlus}
                                                customStyle={{ margin: 0, padding: 0, background: 'transparent' }}
                                                wrapLongLines
                                            >
                                                {msg.content}
                                            </SyntaxHighlighter>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleCopyToInput(msg.content)}
                                                    className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
                                                    title="Copy to Input"
                                                >
                                                    <Copy className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenSaveQuery(msg.content)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-400 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
                                                    title="Save Query"
                                                >
                                                    <Bookmark className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </>
                                    ) : msg.type === 'saved-query' ? (
                                        <div className="space-y-4">
                                            <div className={cn(
                                                "flex items-center gap-2 font-bold text-sm",
                                                msg.scope === 'general' ? "text-purple-400" : "text-emerald-400"
                                            )}>
                                                <Bookmark className="w-4 h-4" />
                                                <span>{msg.name}</span>
                                                {msg.scope === 'general' && (
                                                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase tracking-wider">General</span>
                                                )}
                                            </div>
                                            <SyntaxHighlighter
                                                language="sql"
                                                style={vscDarkPlus}
                                                customStyle={{ margin: 0, padding: '12px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}
                                                wrapLongLines
                                            >
                                                {msg.content}
                                            </SyntaxHighlighter>
                                            <button
                                                onClick={() => handleCopyToInput(msg.content)}
                                                className={cn(
                                                    "mt-2 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg transition-colors border",
                                                    msg.scope === 'general' 
                                                        ? "bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border-purple-500/20"
                                                        : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/20"
                                                )}
                                            >
                                                <Copy className="w-3 h-3" />
                                                Use this Query
                                            </button>
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenDeleteConfirm(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
                                                    title="Delete Saved Query"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : msg.type === 'error' ? (
                                        <pre className="whitespace-pre-wrap font-mono text-xs">{msg.content}</pre>
                                    ) : msg.type === 'mermaid' ? (
                                        <div className="py-2">
                                            <MermaidRender chart={msg.content} />
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    ul: ({ ...props }) => (
                                                        <ul className="list-disc list-inside ml-2 my-2 space-y-1 text-slate-300" {...props} />
                                                    ),
                                                    ol: ({ ...props }) => (
                                                        <ol className="list-decimal list-inside ml-2 my-2 space-y-1 text-slate-300" {...props} />
                                                    ),
                                                    li: ({ ...props }) => (
                                                        <li className="pl-1" {...props} />
                                                    ),
                                                    table: ({ ...props }) => (
                                                        <table className="w-full text-sm border-separate border-spacing-0 border border-slate-700/50 rounded-lg overflow-hidden my-2" {...props} />
                                                    ),
                                                    thead: ({ ...props }) => (
                                                        <thead className="bg-slate-950/50" {...props} />
                                                    ),
                                                    tr: ({ ...props }) => (
                                                        <tr className="group transition-colors hover:bg-slate-800/30 even:bg-slate-900/20" {...props} />
                                                    ),
                                                    th: ({ ...props }) => (
                                                        <th className="text-left py-3 px-4 font-semibold text-slate-200 text-xs uppercase tracking-wider border-b border-slate-700/50 first:pl-4 last:pr-4" {...props} />
                                                    ),
                                                    td: ({ children, ...props }) => {
                                                        // Check if content looks like JSON object or array
                                                        const content = String(children);
                                                        const isJson = (content.startsWith('{') && content.endsWith('}')) || (content.startsWith('[') && content.endsWith(']'));

                                                        return (
                                                            <td className={cn(
                                                                "py-3 px-4 text-slate-400 text-xs border-b border-slate-800/50 group-last:border-0 font-mono first:pl-4 last:pr-4 whitespace-nowrap",
                                                                isJson && "text-emerald-400"
                                                            )} {...props}>
                                                                {children}
                                                            </td>
                                                        );
                                                    },
                                                    a: ({ ...props }) => (
                                                        <a
                                                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors cursor-pointer"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        />
                                                    )
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                    {(msg.type === 'note' || msg.type === 'mermaid') && (
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => msg.type === 'note' ? handleEditNote(idx, msg.content) : handleEditDiagram(idx, msg.content)}
                                                className="p-1.5 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
                                                title={msg.type === 'note' ? "Edit Note" : "Edit Diagram"}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenDeleteConfirm(idx)}
                                                className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800/50 hover:bg-slate-700/80 rounded-lg transition-colors"
                                                title={msg.type === 'note' ? "Delete Note" : "Delete Diagram"}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-950/80 backdrop-blur-md border-t border-slate-800/50">
                <div className="max-w-4xl mx-auto relative">
                    <form
                        onSubmit={executeQuery}
                        className="group flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl focus-within:border-blue-500/50 focus-within:shadow-lg focus-within:shadow-blue-500/10 transition-all duration-300"
                    >
                        <div className="pl-3 py-3 text-slate-500 group-focus-within:text-blue-500 transition-colors">
                            <TerminalIcon className="w-5 h-5" />
                        </div>
                        <Editor
                            value={input}
                            onValueChange={code => setInput(code)}
                            highlight={code => highlight(code, languages.sql, 'sql')}
                            padding={12}
                            className="flex-1 bg-transparent border-none focus-within:ring-0 text-slate-200 placeholder:text-slate-600 text-sm font-mono leading-relaxed selection:bg-blue-500/30 overflow-auto max-h-[40vh] outline-none min-h-[48px]"
                            placeholder="Type your SQL... [Enter for new line, Ctrl+Enter to Execute]"
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            textareaId="sql-input-editor"
                            style={{
                                fontFamily: '"Ubuntu Mono", "Fira Mono", "Fira Code", monospace',
                                minHeight: '48px',
                            }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className={cn(
                                "px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 active:scale-95",
                                loading && "animate-pulse cursor-wait"
                            )}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4 ml-0.5 fill-current" />
                            )}
                        </button>
                    </form>
                    <div className="text-center mt-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold">Postgres 15 • Localhost</span>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                title={editingNoteIndex !== null ? "Edit Note" : "Add Personal Note"}
                className="max-w-4xl"
            >
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex items-center gap-1 p-2 bg-slate-800 rounded-t-lg border border-slate-700 border-b-0 overflow-x-auto">
                        <button onClick={handleBold} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Bold">
                            <Bold className="w-4 h-4" />
                        </button>
                        <button onClick={handleItalic} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Italic">
                            <Italic className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1" />
                        <button onClick={handleLink} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Link">
                            <LinkIcon className="w-4 h-4" />
                        </button>
                        <button onClick={handleImage} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Image">
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1" />
                        <button onClick={handleUnorderedList} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Unordered List">
                            <List className="w-4 h-4" />
                        </button>
                        <button onClick={handleOrderedList} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Ordered List">
                            <ListOrdered className="w-4 h-4" />
                        </button>
                        <div className="w-px h-6 bg-slate-700 mx-1" />
                        <button onClick={handleHeading} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Heading">
                            <Heading className="w-4 h-4" />
                        </button>
                        <button onClick={handleQuote} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Quote">
                            <Quote className="w-4 h-4" />
                        </button>
                        <button onClick={handleCodeBlock} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Code Block">
                            <Code className="w-4 h-4" />
                        </button>
                    </div>

                    <textarea
                        ref={noteTextareaRef}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Write your note here... (Markdown supported)"
                        className="w-full h-[60vh] bg-slate-800 border border-slate-700 rounded-b-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none font-mono mt-0"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsNoteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSendNote}
                            disabled={!noteContent.trim() || sendingNote}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sendingNote ? 'Saving...' : (editingNoteIndex !== null ? 'Save Changes' : 'Add Note')}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Note"
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <div className="p-2 bg-red-500/20 rounded-full text-red-400">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-red-200 font-medium mb-1">Are you sure?</h4>
                            <p className="text-sm text-red-200/70">
                                This action cannot be undone. This item will be permanently removed from this session.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isDiagramModalOpen}
                onClose={() => setIsDiagramModalOpen(false)}
                title={editingDiagramIndex !== null ? "Edit Diagram" : "Add Mermaid Diagram"}
                className="max-w-4xl"
            >
                <div className="space-y-4">
                    <textarea
                        ref={diagramTextareaRef}
                        value={diagramContent}
                        onChange={(e) => setDiagramContent(e.target.value)}
                        placeholder="Paste your Mermaid code here..."
                        className="w-full h-[60vh] bg-slate-800 border border-slate-700 rounded-lg p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none font-mono"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsDiagramModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSendDiagram}
                            disabled={!diagramContent.trim() || sendingDiagram}
                            className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {sendingDiagram ? 'Saving...' : (editingDiagramIndex !== null ? 'Save Changes' : 'Add Diagram')}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isSaveQueryModalOpen}
                onClose={() => setIsSaveQueryModalOpen(false)}
                title="Save SQL Query"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Query Name</label>
                        <input
                            type="text"
                            value={savedQueryName}
                            onChange={(e) => setSavedQueryName(e.target.value)}
                            placeholder="e.g. Get All Users"
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">Storage Scope</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSaveScope('session')}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all",
                                    saveScope === 'session'
                                        ? "bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10"
                                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                This Session Only
                            </button>
                            <button
                                onClick={() => setSaveScope('general')}
                                className={cn(
                                    "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-all",
                                    saveScope === 'general'
                                        ? "bg-purple-600/20 border-purple-500/50 text-purple-400 shadow-lg shadow-purple-500/10"
                                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                General (All Sessions)
                            </button>
                        </div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                        <pre className="text-xs font-mono text-slate-400 max-h-32 overflow-auto">{queryToSave}</pre>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            onClick={() => setIsSaveQueryModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmSaveQuery}
                            disabled={!savedQueryName.trim() || isSavingQuery}
                            className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSavingQuery ? 'Saving...' : 'Save Query'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
