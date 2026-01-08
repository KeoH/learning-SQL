import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal', () => {
    it('renders when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={() => {}} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );

        expect(screen.getByText('Test Modal')).toBeInTheDocument();
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <Modal isOpen={false} onClose={() => {}} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );

        expect(container.firstChild).toBeNull();
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );

        const closeButton = screen.getByLabelText('Close modal');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when clicking the backdrop', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <div>Modal Content</div>
            </Modal>
        );

        // The backdrop is the first div with bg-slate-950/80
        const backdrop = screen.getByText('Modal Content').closest('.fixed.inset-0');
        if (backdrop) {
            fireEvent.click(backdrop);
        }

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when clicking modal content', () => {
        const onClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={onClose} title="Test Modal">
                <div data-testid="modal-content">Modal Content</div>
            </Modal>
        );

        const content = screen.getByTestId('modal-content');
        fireEvent.click(content);

        expect(onClose).not.toHaveBeenCalled();
    });
});
