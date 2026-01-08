import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatHeader } from './ChatHeader';
import { SidebarProvider } from './SidebarContext';

describe('ChatHeader', () => {
    const defaultProps = {
        title: 'Test Session',
        onRename: vi.fn(),
        onDelete: vi.fn(),
        onAddNote: vi.fn(),
        onAddDiagram: vi.fn(),
        savedQueries: [
            { type: 'saved-query' as const, content: 'SELECT 1', name: 'Query 1', scope: 'session' as const, raw: '' },
            { type: 'saved-query' as const, content: 'SELECT 2', name: 'Query 2', scope: 'general' as const, raw: '' },
        ],
        onSelectQuery: vi.fn(),
        onDeleteQuery: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const renderHeader = (props = defaultProps) => {
        return render(
            <SidebarProvider>
                <ChatHeader {...props} />
            </SidebarProvider>
        );
    };

    it('renders the title correctly', () => {
        renderHeader();
        expect(screen.getByText('Test Session')).toBeInTheDocument();
    });

    it('calls onRename when rename mode is toggled and saved', () => {
        renderHeader();
        
        // Click title to enter edit mode
        const title = screen.getByText('Test Session');
        fireEvent.click(title);

        const input = screen.getByDisplayValue('Test Session');
        fireEvent.change(input, { target: { value: 'New Title' } });

        const saveBtn = screen.getByTitle('Save');
        fireEvent.click(saveBtn);

        expect(defaultProps.onRename).toHaveBeenCalledWith('New Title');
    });

    it('calls onDelete when delete button is clicked and confirmed in modal', async () => {
        renderHeader();
        
        const deleteBtn = screen.getByTitle('Delete session');
        fireEvent.click(deleteBtn);

        // Check if modal is open using findByText to handle potential animation duration
        const modalText = await screen.findByText(/Are you sure you want to delete this session/i);
        expect(modalText).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmBtn);

        expect(defaultProps.onDelete).toHaveBeenCalled();
    });

    it('calls onAddNote when add note button is clicked', () => {
        renderHeader();
        const addNoteBtn = screen.getByText('Note');
        fireEvent.click(addNoteBtn);
        expect(defaultProps.onAddNote).toHaveBeenCalled();
    });

    it('calls onAddDiagram when add diagram button is clicked', () => {
        renderHeader();
        const addDiagramBtn = screen.getByText('Diagram');
        fireEvent.click(addDiagramBtn);
        expect(defaultProps.onAddDiagram).toHaveBeenCalled();
    });

    it('toggles saved queries dropdown', () => {
        renderHeader();
        const dropdownBtn = screen.getByText('Queries');
        
        fireEvent.click(dropdownBtn);
        expect(screen.getByText('Query 1')).toBeInTheDocument();
        expect(screen.getByText('Query 2')).toBeInTheDocument();
    });

    it('calls onSelectQuery when a query is clicked', () => {
        renderHeader();
        fireEvent.click(screen.getByText('Queries'));
        
        fireEvent.click(screen.getByText('Query 1'));
        expect(defaultProps.onSelectQuery).toHaveBeenCalledWith('SELECT 1');
    });

    it('calls onDeleteQuery when delete query button is clicked', () => {
        renderHeader();
        fireEvent.click(screen.getByText('Queries'));
        
        const deleteBtns = screen.getAllByTitle('Delete saved query');
        fireEvent.click(deleteBtns[0]);

        expect(defaultProps.onDeleteQuery).toHaveBeenCalledWith('Query 1', 'session');
    });
});
