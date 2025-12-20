import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInterface } from './ChatInterface';
import { act } from 'react';

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
        // Mock empty history response
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        });

        await act(async () => {
            render(<ChatInterface sessionId="test-session" />);
        });

        expect(screen.getByText('Start conversational SQL...')).toBeInTheDocument();
    });

    it('handles user input and submission', async () => {
        // Mock empty history response
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ content: '' }),
        });

        // Mock execute response
        (global.fetch as any).mockResolvedValueOnce({
            json: async () => ({ markdown: 'Result: | id | name |\n|---|---|\n| 1 | Test |' }),
        });

        await act(async () => {
            render(<ChatInterface sessionId="test-session" />);
        });

        const input = screen.getByPlaceholderText(/Write your SQL query/i);
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
