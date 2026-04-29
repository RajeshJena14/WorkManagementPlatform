import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Modal from '../Modal';

describe('Modal Component', () => {
    beforeEach(() => {
        // Reset body style before each test
        document.body.style.overflow = '';
    });

    it('should not render when isOpen is false', () => {
        const { container } = render(
            <Modal isOpen={false} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(container.firstChild).toBeNull();
        expect(document.body.style.overflow).toBe('unset');
    });

    it('should render children when isOpen is true', () => {
        render(
            <Modal isOpen={true} onClose={() => {}}>
                <div data-testid="modal-content">Modal Content</div>
            </Modal>
        );
        expect(screen.getByTestId('modal-content')).toBeInTheDocument();
        expect(screen.getByText('Modal Content')).toBeInTheDocument();
    });

    it('should call onClose when the close button is clicked', () => {
        const handleClose = vi.fn();
        render(
            <Modal isOpen={true} onClose={handleClose}>
                <div>Modal Content</div>
            </Modal>
        );

        const closeButton = screen.getByRole('button', { name: /close modal/i });
        fireEvent.click(closeButton);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('should set body overflow to hidden when open and reset when unmounted or closed', () => {
        const { rerender, unmount } = render(
            <Modal isOpen={true} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(document.body.style.overflow).toBe('hidden');

        // Test closing
        rerender(
            <Modal isOpen={false} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(document.body.style.overflow).toBe('unset');

        // Test opening again then unmounting
        rerender(
            <Modal isOpen={true} onClose={() => {}}>
                <div>Modal Content</div>
            </Modal>
        );
        expect(document.body.style.overflow).toBe('hidden');
        unmount();
        expect(document.body.style.overflow).toBe('unset');
    });
});
