import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SavedQueriesModal } from './SavedQueriesModal';

describe('SavedQueriesModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        savedQueries: [
            { name: 'Session Query', content: 'SELECT * FROM session', scope: 'session' as const },
            { name: 'General Query', content: 'SELECT * FROM general', scope: 'general' as const },
        ],
        onSelectQuery: vi.fn(),
        onDeleteQuery: vi.fn(),
        onSaveQuery: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders local queries by default', () => {
        render(<SavedQueriesModal {...defaultProps} />);
        expect(screen.getByText('Session Query')).toBeInTheDocument();
        expect(screen.queryByText('General Query')).not.toBeInTheDocument();
    });

    it('switches between scopes', () => {
        render(<SavedQueriesModal {...defaultProps} />);
        
        const generalBtn = screen.getByText('General');
        fireEvent.click(generalBtn);
        
        expect(screen.getByText('General Query')).toBeInTheDocument();
        expect(screen.queryByText('Session Query')).not.toBeInTheDocument();
    });

    it('filters queries by search term', () => {
        const manyQueries = {
            ...defaultProps,
            savedQueries: [
                { name: 'Apple', content: 'SELECT apple', scope: 'session' as const },
                { name: 'Banana', content: 'SELECT banana', scope: 'session' as const },
            ]
        };
        render(<SavedQueriesModal {...manyQueries} />);
        
        const searchInput = screen.getByPlaceholderText('Search queries...');
        fireEvent.change(searchInput, { target: { value: 'Apple' } });
        
        expect(screen.getByText('Apple')).toBeInTheDocument();
        expect(screen.queryByText('Banana')).not.toBeInTheDocument();
    });

    it('calls onSelectQuery and onClose when Use Query is clicked', () => {
        render(<SavedQueriesModal {...defaultProps} />);
        const useBtn = screen.getByText('Use Query');
        fireEvent.click(useBtn);
        
        expect(defaultProps.onSelectQuery).toHaveBeenCalledWith('SELECT * FROM session');
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('opens add form and calls onSaveQuery', () => {
        render(<SavedQueriesModal {...defaultProps} />);
        
        fireEvent.click(screen.getByText('Add New Query'));
        
        const nameInput = screen.getByPlaceholderText('Enter query name...');
        const sqlInput = screen.getByPlaceholderText('SELECT * FROM...');
        
        fireEvent.change(nameInput, { target: { value: 'New Test Query' } });
        fireEvent.change(sqlInput, { target: { value: 'SELECT 1' } });
        
        fireEvent.click(screen.getByText('Save Query'));
        
        expect(defaultProps.onSaveQuery).toHaveBeenCalledWith('New Test Query', 'SELECT 1', 'session');
    });

    it('calls onDeleteQuery when delete button is clicked', () => {
        render(<SavedQueriesModal {...defaultProps} />);
        
        const deleteBtn = screen.getByTitle('Delete query');
        fireEvent.click(deleteBtn);
        
        expect(defaultProps.onDeleteQuery).toHaveBeenCalledWith('Session Query', 'session');
    });
});
