import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Layout from '../Layout';

// 1. Mock the Child Components to isolate Layout's logic
vi.mock('../Sidebar', () => ({
    default: ({ isOpen, setIsOpen }) => (
        <div data-testid="mock-sidebar" data-isopen={isOpen}>
            <button onClick={() => setIsOpen(false)}>Close Sidebar</button>
        </div>
    )
}));

vi.mock('../Navbar', () => ({
    default: ({ onMenuClick }) => (
        <div data-testid="mock-navbar">
            <button onClick={onMenuClick}>Open Mobile Menu</button>
        </div>
    )
}));

vi.mock('react-router-dom', () => ({
    Outlet: () => <div data-testid="mock-outlet">Page Content</div>
}));

describe('Layout Component', () => {
    it('should render Navbar, Sidebar, and Outlet on initial load', () => {
        render(<Layout />);

        expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
        expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
        expect(screen.getByTestId('mock-outlet')).toBeInTheDocument();
    });

    it('should have the sidebar closed by default', () => {
        render(<Layout />);

        const sidebar = screen.getByTestId('mock-sidebar');
        // Because of our mock, we can check the data-attribute passed to it
        expect(sidebar.getAttribute('data-isopen')).toBe('false');

        // The mobile overlay should NOT exist yet
        const overlay = document.querySelector('.bg-slate-900\\/60');
        expect(overlay).toBeNull();
    });

    it('should open the sidebar overlay when the Navbar menu button is clicked', () => {
        render(<Layout />);

        // Click the trigger button inside our Mock Navbar
        const openMenuBtn = screen.getByText('Open Mobile Menu');
        fireEvent.click(openMenuBtn);

        // Sidebar prop should now be true
        const sidebar = screen.getByTestId('mock-sidebar');
        expect(sidebar.getAttribute('data-isopen')).toBe('true');

        // The dark background overlay should now be rendered
        const overlay = document.querySelector('.bg-slate-900\\/60');
        expect(overlay).toBeInTheDocument();
    });

    it('should close the sidebar when the dark overlay is clicked', () => {
        render(<Layout />);

        // 1. Open the sidebar first
        fireEvent.click(screen.getByText('Open Mobile Menu'));
        let overlay = document.querySelector('.bg-slate-900\\/60');
        expect(overlay).toBeInTheDocument();

        // 2. Click the overlay
        fireEvent.click(overlay);

        // 3. Verify it closed
        const sidebar = screen.getByTestId('mock-sidebar');
        expect(sidebar.getAttribute('data-isopen')).toBe('false');

        // Overlay should be removed from the DOM
        overlay = document.querySelector('.bg-slate-900\\/60');
        expect(overlay).toBeNull();
    });

    it('should close the sidebar when the Sidebar component triggers a close', () => {
        render(<Layout />);

        // 1. Open the sidebar
        fireEvent.click(screen.getByText('Open Mobile Menu'));

        // 2. Click the close button inside our Mock Sidebar (simulating a link click or 'X' button)
        fireEvent.click(screen.getByText('Close Sidebar'));

        // 3. Verify it closed
        const sidebar = screen.getByTestId('mock-sidebar');
        expect(sidebar.getAttribute('data-isopen')).toBe('false');
    });
});