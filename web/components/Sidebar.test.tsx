import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from './Sidebar';
import { SidebarProvider } from './SidebarContext';

// Mock useRouter
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        pathname: '/',
    }),
    usePathname: () => '/',
}));

// Mock fetch
global.fetch = vi.fn();

describe('Sidebar', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Default mock for fetch (sessions and databases)
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            if (url === '/api/history') {
                return {
                    ok: true,
                    json: async () => [],
                } as Response;
            }
            if (url === '/api/databases') {
                return {
                    ok: true,
                    json: async () => ['db1', 'db2'],
                } as Response;
            }
            return { ok: false } as Response;
        });
    });

    const renderSidebar = () => {
        return render(
            <SidebarProvider>
                <Sidebar />
            </SidebarProvider>
        );
    };

    it('renders the sidebar correctly', async () => {
        await act(async () => {
            renderSidebar();
        });
        
        expect(screen.getByText('SQL Playground')).toBeInTheDocument();
        expect(screen.getByTitle('New Session')).toBeInTheDocument();
    });

    it('fetches and displays sessions on mount', async () => {
        const sessions = [{ id: '1', name: 'Session 1', timestamp: Date.now() }];
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            if (url === '/api/history') {
                return {
                    ok: true,
                    json: async () => sessions,
                } as Response;
            }
            return { ok: true, json: async () => [] } as Response;
        });

        await act(async () => {
            renderSidebar();
        });

        expect(await screen.findByText('Session 1')).toBeInTheDocument();
    });

    it('opens modal when New Session is clicked', async () => {
        await act(async () => {
            renderSidebar();
        });

        const newSessionBtn = screen.getByTitle('New Session');
        fireEvent.click(newSessionBtn);

        expect(screen.getByText('Create New Session')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('My SQL Practice')).toBeInTheDocument();
    });

    it('calls POST /api/history when creating a session', async () => {
        await act(async () => {
            renderSidebar();
        });

        // Open modal
        fireEvent.click(screen.getByTitle('New Session'));

        // Fill form
        const input = screen.getByPlaceholderText('My SQL Practice');
        fireEvent.change(input, { target: { value: 'New Test Session' } });

        // Mock POST response
        vi.mocked(global.fetch).mockImplementation(async (url, init) => {
            if (url === '/api/history' && init?.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({ id: 'new-id' }),
                } as Response;
            }
            return { ok: true, json: async () => [] } as Response;
        });

        const createBtn = screen.getByRole('button', { name: 'Create' });
        await act(async () => {
            fireEvent.click(createBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('New Test Session'),
        }));
        expect(pushMock).toHaveBeenCalledWith('/session/new-id');
    });
});
