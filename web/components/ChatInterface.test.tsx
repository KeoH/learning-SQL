import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { act } from 'react';
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

    it('renders the initial state correctly', async () => {
        // Mock empty history responses (two calls)
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        } as unknown as Response);
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        } as unknown as Response);

        await act(async () => {
            render(
                <SidebarProvider>
                    <ChatInterface sessionId="test-session" />
                </SidebarProvider>
            );
        });

        expect(screen.getByText('Start conversational SQL...')).toBeInTheDocument();
    });

    it('handles user input and submission', async () => {
        // Mock history responses (two calls)
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        } as unknown as Response);
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        } as unknown as Response);

        // Mock execute response
        vi.mocked(global.fetch).mockResolvedValueOnce({
            json: async () => ({ markdown: 'Result: | id | name |\n|---|---|\n| 1 | Test |' }),
        } as unknown as Response);

        await act(async () => {
            render(
                <SidebarProvider>
                    <ChatInterface sessionId="test-session" />
                </SidebarProvider>
            );
        });

        const input = screen.getByPlaceholderText(/Type your SQL/i);
        // There are multiple buttons now (Delete, Add Note, Send). We need the submit button.
        const button = document.querySelector('button[type="submit"]') as HTMLButtonElement;

        fireEvent.change(input, { target: { value: 'SELECT * FROM users' } });
        fireEvent.click(button);

        // Optimistic update should show the query.
        // We check for "You" which is the label for user messages.
        expect(screen.getByText('You')).toBeInTheDocument();

        // We check that the input is cleared or disabled (loading state)
        // Note: The input might be disabled because loading is true.
        expect(input).toHaveValue('');
        expect(button).toBeDisabled();

        await waitFor(() => {
            // Check if fetch was called with correct arguments
            expect(global.fetch).toHaveBeenCalledWith('/api/execute', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ sql: 'SELECT * FROM users', sessionId: 'test-session' }),
            }));
        });
    });
});
