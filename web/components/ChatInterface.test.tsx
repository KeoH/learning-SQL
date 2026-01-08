import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { SidebarProvider } from './SidebarContext';

// Mock useRouter
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
}));

// Mock fetch
global.fetch = vi.fn();

describe('ChatInterface', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    const mockInitialFetch = () => {
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/history/test-session')) {
                return {
                    ok: true,
                    json: async () => ({ content: '# Test Session\n## Query\n```sql\nSELECT 1;\n```' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/history/general')) {
                return {
                    ok: true,
                    json: async () => ({ content: '' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/databases')) {
                return {
                    ok: true,
                    json: async () => (['db1', 'db2']),
                } as unknown as Response;
            }
            return { ok: false } as Response;
        });
    };

    const renderChat = async () => {
        let result: ReturnType<typeof render> | undefined;
        await act(async () => {
            result = render(
                <SidebarProvider>
                    <ChatInterface sessionId="test-session" />
                </SidebarProvider>
            );
        });
        return result!;
    };

    it('renders the initial state correctly', async () => {
        mockInitialFetch();
        await renderChat();
        expect(await screen.findByText('Test Session')).toBeInTheDocument();
        // Use a more specific check for the code
        expect(screen.getAllByText(/SELECT/)[0]).toBeInTheDocument();
        expect(screen.getAllByText(/1/)[0]).toBeInTheDocument();
    });

    it('handles session renaming', async () => {
        mockInitialFetch();
        await renderChat();

        await screen.findByText('Test Session');
        const titleBtn = screen.getByTitle('Click to rename');
        fireEvent.click(titleBtn);

        const input = screen.getByDisplayValue('Test Session');
        fireEvent.change(input, { target: { value: 'New Title' } });

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
        } as unknown as Response);

        const saveBtn = screen.getByTitle('Save');
        await act(async () => {
            fireEvent.click(saveBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history/test-session', expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ name: 'New Title' }),
        }));
        expect(screen.getByText('New Title')).toBeInTheDocument();
    });

    it('handles session deletion', async () => {
        mockInitialFetch();
        await renderChat();

        const deleteBtn = screen.getByTitle('Delete session');
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/Are you sure you want to delete this session/i)).toBeInTheDocument();

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
        } as unknown as Response);

        const confirmBtn = screen.getByRole('button', { name: 'Delete' });
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history/test-session', expect.objectContaining({
            method: 'DELETE',
        }));
        expect(pushMock).toHaveBeenCalledWith('/');
    });

    it('handles adding a personal note', async () => {
        mockInitialFetch();
        await renderChat();

        const addNoteBtn = screen.getByText('Note');
        fireEvent.click(addNoteBtn);

        expect(await screen.findByText('Add Personal Note')).toBeInTheDocument();

        const textarea = screen.getByPlaceholderText(/Write your note here/i);
        fireEvent.change(textarea, { target: { value: 'This is a test note' } });

        vi.mocked(global.fetch).mockResolvedValueOnce({
            ok: true,
        } as unknown as Response);

        const sendBtn = screen.getByText('Add Note');
        await act(async () => {
            fireEvent.click(sendBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history/test-session', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('This is a test note'),
        }));
    });

    it('handles editing a note', async () => {
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/history/test-session')) {
                return {
                    ok: true,
                    json: async () => ({ content: '# Title\n## Note\nThis is a note' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/history/general')) {
                return { ok: true, json: async () => ({ content: '' }) } as unknown as Response;
            }
            return { ok: true, json: async () => ({}) } as Response;
        });
        await renderChat();

        const editBtn = await screen.findByTitle('Edit Note');
        fireEvent.click(editBtn);

        expect(await screen.findByText('Edit Note')).toBeInTheDocument();
        const textarea = screen.getByDisplayValue('This is a note');
        fireEvent.change(textarea, { target: { value: 'Updated note' } });

        vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

        const saveChangesBtn = screen.getByText('Save Changes');
        await act(async () => {
            fireEvent.click(saveChangesBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history/test-session', expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('Updated note'),
        }));
    });

    it('handles deleting a note', async () => {
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/history/test-session')) {
                return {
                    ok: true,
                    json: async () => ({ content: '# Title\n## Note\nThis is a note' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/history/general')) {
                return { ok: true, json: async () => ({ content: '' }) } as unknown as Response;
            }
            return { ok: true, json: async () => ({}) } as Response;
        });
        await renderChat();

        const deleteBtn = await screen.findByTitle('Delete Note');
        fireEvent.click(deleteBtn);

        expect(await screen.findByText(/Are you sure\?/i)).toBeInTheDocument();

        vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

        const confirmBtn = screen.getByRole('button', { name: 'Delete' });
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/history/test-session'), expect.objectContaining({
            method: 'DELETE',
        }));
    });

    it('handles saving a query from chat', async () => {
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/history/test-session')) {
                return {
                    ok: true,
                    json: async () => ({ content: '# Title\n## Query\n```sql\nSELECT * FROM test;\n```' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/history/general')) {
                return { ok: true, json: async () => ({ content: '' }) } as unknown as Response;
            }
            return { ok: true, json: async () => ({}) } as Response;
        });
        await renderChat();

        const saveBtn = await screen.findByTitle('Save Query');
        fireEvent.click(saveBtn);

        expect(await screen.findByText('Save SQL Query')).toBeInTheDocument();
        const input = screen.getByPlaceholderText('e.g. Get All Users');
        fireEvent.change(input, { target: { value: 'My Saved Query' } });

        vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as unknown as Response);

        const confirmBtn = screen.getByText('Save Query');
        await act(async () => {
            fireEvent.click(confirmBtn);
        });

        expect(global.fetch).toHaveBeenCalledWith('/api/history/test-session', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('My Saved Query'),
        }));
    });

    it('handles copying a query to input', async () => {
        vi.mocked(global.fetch).mockImplementation(async (url) => {
            const urlStr = url.toString();
            if (urlStr.includes('/api/history/test-session')) {
                return {
                    ok: true,
                    json: async () => ({ content: '# Title\n## Query\n```sql\nSELECT * FROM copy_test;\n```' }),
                } as unknown as Response;
            }
            if (urlStr.includes('/api/history/general')) {
                return { ok: true, json: async () => ({ content: '' }) } as unknown as Response;
            }
            return { ok: true, json: async () => ({}) } as Response;
        });
        await renderChat();

        const copyBtn = await screen.findByTitle('Copy to Input');
        fireEvent.click(copyBtn);

        const input = screen.getByPlaceholderText(/Type your SQL/i);
        expect(input).toHaveValue('SELECT * FROM copy_test;');
    });
});
