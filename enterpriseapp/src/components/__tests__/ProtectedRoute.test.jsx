import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProtectedRoute from '../ProtectedRoute';
import * as reactRedux from 'react-redux';
import * as reactRouterDom from 'react-router-dom';

// Mock react-redux
vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
    Navigate: vi.fn(({ to, replace }) => <div data-testid={`navigate-${to}`}>{to} {replace ? 'replaced' : ''}</div>),
    Outlet: vi.fn(() => <div data-testid="outlet">Outlet</div>),
}));

describe('ProtectedRoute Component', () => {
    it('should navigate to /login if user is not authenticated', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: false, role: 'Employee' });

        const { getByTestId } = render(<ProtectedRoute />);
        
        expect(getByTestId('navigate-/login')).toBeInTheDocument();
    });

    it('should navigate to /dashboard if user is authenticated but does not have allowed role', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Employee' });

        const { getByTestId } = render(<ProtectedRoute allowedRoles={['Admin', 'Manager']} />);
        
        expect(getByTestId('navigate-/dashboard')).toBeInTheDocument();
    });

    it('should render Outlet if user is authenticated and has allowed role', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Admin' });

        const { getByTestId } = render(<ProtectedRoute allowedRoles={['Admin', 'Manager']} />);
        
        expect(getByTestId('outlet')).toBeInTheDocument();
    });

    it('should render Outlet if user is authenticated and no allowed roles are specified', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Employee' });

        const { getByTestId } = render(<ProtectedRoute />);
        
        expect(getByTestId('outlet')).toBeInTheDocument();
    });
});
