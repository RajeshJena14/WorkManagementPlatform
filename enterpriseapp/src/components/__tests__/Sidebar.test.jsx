import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from '../Sidebar';
import { MemoryRouter } from 'react-router-dom';
import * as reactRedux from 'react-redux';

// Mock react-redux
vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
}));

describe('Sidebar Component', () => {
    it('should render Dashboard, Project Center, and Project Board links for non-admin', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Employee' });

        render(
            <MemoryRouter>
                <Sidebar isOpen={true} setIsOpen={() => {}} />
            </MemoryRouter>
        );

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Project Center')).toBeInTheDocument();
        expect(screen.getByText('Project Board')).toBeInTheDocument();
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
    });

    it('should render User Management link for Admin', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Admin' });

        render(
            <MemoryRouter>
                <Sidebar isOpen={true} setIsOpen={() => {}} />
            </MemoryRouter>
        );

        expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('should apply translate class based on isOpen prop', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Employee' });

        const { container: openContainer } = render(
            <MemoryRouter>
                <Sidebar isOpen={true} setIsOpen={() => {}} />
            </MemoryRouter>
        );
        expect(openContainer.firstChild).toHaveClass('translate-x-0');

        const { container: closedContainer } = render(
            <MemoryRouter>
                <Sidebar isOpen={false} setIsOpen={() => {}} />
            </MemoryRouter>
        );
        expect(closedContainer.firstChild).toHaveClass('-translate-x-full');
    });

    it('should call setIsOpen(false) when a link is clicked', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Employee' });
        const setIsOpen = vi.fn();

        render(
            <MemoryRouter>
                <Sidebar isOpen={true} setIsOpen={setIsOpen} />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByText('Dashboard'));
        expect(setIsOpen).toHaveBeenCalledWith(false);
    });

    it('should call setIsOpen(false) when mobile close button is clicked', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Employee' });
        const setIsOpen = vi.fn();

        render(
            <MemoryRouter>
                <Sidebar isOpen={true} setIsOpen={setIsOpen} />
            </MemoryRouter>
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(setIsOpen).toHaveBeenCalledWith(false);
    });
});
