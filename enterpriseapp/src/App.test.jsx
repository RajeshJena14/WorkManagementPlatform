import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import * as reactRedux from 'react-redux';

// 1. Mock Redux to control Authentication and Role States
vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
}));

// 2. Mock all the Pages to render simple dummy divs
vi.mock('./pages/Login', () => ({ default: () => <div data-testid="login-page">Login Page</div> }));
vi.mock('./pages/Dashboard', () => ({ default: () => <div data-testid="dashboard-page">Dashboard Page</div> }));
vi.mock('./pages/Projects', () => ({ default: () => <div data-testid="projects-page">Projects Page</div> }));
vi.mock('./pages/KanbanBoard', () => ({ default: () => <div data-testid="board-page">Board Page</div> }));
vi.mock('./pages/Settings', () => ({ default: () => <div data-testid="settings-page">Settings Page</div> }));
vi.mock('./pages/UserManagement', () => ({ default: () => <div data-testid="users-page">Users Page</div> }));

// Mock Layout to just render its children (the Outlet)
vi.mock('./components/Layout', () => {
    const { Outlet } = require('react-router-dom');
    return { default: () => <div data-testid="layout"><Outlet /></div> };
});

describe('App Routing & Security', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper function to simulate a user typing a URL into their browser
    const renderAtRoute = (route) => {
        window.history.pushState({}, 'Test page', route);
        render(<App />);
    };

    // --- PUBLIC ROUTE TESTS ---

    it('should render the Login page on the /login route', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: false, role: null });
        renderAtRoute('/login');
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    it('should render the Unauthorized page on the /unauthorized route', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: false, role: null });
        renderAtRoute('/unauthorized');
        expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    // --- UNAUTHENTICATED PROTECTION TESTS ---

    it('should redirect UNAUTHENTICATED users from protected routes to /login', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: false, role: null });
        renderAtRoute('/dashboard');

        expect(screen.getByTestId('login-page')).toBeInTheDocument();
        expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
    });

    it('should redirect UNAUTHENTICATED users hitting wildcard URLs to /login', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: false, role: null });
        renderAtRoute('/some-random-broken-link');

        // The wildcard catches them, sends to /dashboard, which then bounces to /login
        await waitFor(() => {
            expect(screen.getByTestId('login-page')).toBeInTheDocument();
            expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
        });
    });

    // --- AUTHENTICATED ACCESS TESTS ---

    it('should allow AUTHENTICATED users to access standard protected routes', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Employee' });
        renderAtRoute('/dashboard');

        expect(screen.getByTestId('layout')).toBeInTheDocument();
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    // --- ROLE-BASED AUTHORIZATION TESTS ---

    it('should block Employees from accessing Admin-only routes (/users)', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Employee' });
        renderAtRoute('/users');

        // ProtectedRoute sees the wrong role and bounces them back to their Dashboard
        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('users-page')).not.toBeInTheDocument();
    });

    it('should block Managers from accessing Admin-only routes (/users)', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Manager' });
        renderAtRoute('/users');

        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
        expect(screen.queryByTestId('users-page')).not.toBeInTheDocument();
    });

    it('should allow Admins to access Admin-only routes (/users)', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Admin' });
        renderAtRoute('/users');

        expect(screen.getByTestId('users-page')).toBeInTheDocument();
    });

    // --- WILDCARD / FALLBACK TESTS ---

    it('should catch unknown wildcard URLs and redirect AUTHENTICATED users to the dashboard', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isAuthenticated: true, role: 'Manager' });
        renderAtRoute('/some-broken-url-that-does-not-exist');

        expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
});