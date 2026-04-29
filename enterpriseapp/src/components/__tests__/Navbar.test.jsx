import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from '../Navbar';
import { MemoryRouter } from 'react-router-dom';
import * as reactRedux from 'react-redux';
import api from '../../services/api';

// Mocks
vi.mock('react-redux', () => ({
    useSelector: vi.fn(),
    useDispatch: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('socket.io-client', () => {
    const mockSocket = {
        on: vi.fn(),
        emit: vi.fn(),
        disconnect: vi.fn(),
    };
    return { io: vi.fn(() => mockSocket) };
});

vi.mock('react-toastify', () => ({
    toast: { info: vi.fn(), error: vi.fn() },
}));

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
        patch: vi.fn(),
    }
}));

describe('Navbar Component', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useDispatch).mockReturnValue(mockDispatch);
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            user: { id: '1', name: 'John Doe' },
            role: 'Admin'
        });
        vi.mocked(api.get).mockResolvedValue({ data: [] });
    });

    it('should render user initials and name', () => {
        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
    });

    it('should toggle profile dropdown on click', () => {
        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        const profileButton = screen.getByText('JD').closest('button');
        fireEvent.click(profileButton);

        expect(screen.getByText('Sign out')).toBeInTheDocument();
        expect(screen.getByText('Account Settings')).toBeInTheDocument();

        fireEvent.click(profileButton);
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });

    it('should call dispatch logout and navigate on sign out click', () => {
        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        const profileButton = screen.getByText('JD').closest('button');
        fireEvent.click(profileButton);

        const signOutButton = screen.getByText('Sign out');
        fireEvent.click(signOutButton);

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should call onMenuClick when mobile menu button is clicked', () => {
        const onMenuClick = vi.fn();
        render(
            <MemoryRouter>
                <Navbar onMenuClick={onMenuClick} />
            </MemoryRouter>
        );

        // The first button in the component is the mobile menu trigger
        const menuButton = screen.getAllByRole('button')[0];
        fireEvent.click(menuButton);

        expect(onMenuClick).toHaveBeenCalledTimes(1);
    });

    it('should toggle notification dropdown on click', async () => {
        // Mock notifications
        vi.mocked(api.get).mockResolvedValue({
            data: [{ id: 1, title: 'Test', message: 'Message', read: false, time: new Date().toISOString() }]
        });

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        // Wait for fetch
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/system/notifications'));

        // Bell button is usually the second button
        const bellButton = screen.getAllByRole('button')[1];
        fireEvent.click(bellButton);

        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Mark all as read')).toBeInTheDocument();

        fireEvent.click(bellButton);
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });

    it('should call api.patch when Mark all as read is clicked', async () => {
        // Mock unread notifications
        vi.mocked(api.get).mockResolvedValue({
            data: [{ id: 1, title: 'Test', message: 'Message', read: false, time: new Date().toISOString() }]
        });
        vi.mocked(api.patch).mockResolvedValue({});

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        // Wait for notifications to load
        await waitFor(() => expect(api.get).toHaveBeenCalledWith('/system/notifications'));

        // Open notification dropdown
        const bellButton = screen.getAllByRole('button')[1];
        fireEvent.click(bellButton);

        // Click mark all as read
        const markReadBtn = screen.getByText('Mark all as read');
        fireEvent.click(markReadBtn);

        expect(api.patch).toHaveBeenCalledWith('/system/notifications/read');
    });

    it('should show toast error if Mark all as read fails', async () => {
        const { toast } = await import('react-toastify');
        vi.mocked(api.get).mockResolvedValue({
            data: [{ id: 1, title: 'Test', message: 'Msg', read: false, time: new Date().toISOString() }]
        });
        vi.mocked(api.patch).mockRejectedValue(new Error('API Error'));

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        await waitFor(() => expect(api.get).toHaveBeenCalled());
        fireEvent.click(screen.getAllByRole('button')[1]); // Open dropdown
        fireEvent.click(screen.getByText('Mark all as read'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to update notifications');
        });
    });

    it('should close dropdowns when clicking outside', () => {
        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        // Open Profile Dropdown
        const profileButton = screen.getByText('JD').closest('button');
        fireEvent.click(profileButton);
        expect(screen.getByText('Sign out')).toBeInTheDocument();

        // Simulate click outside (on the document body)
        fireEvent.mouseDown(document.body);

        // Dropdown should disappear
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });

    it('should render fallback text when user is null (Guest User)', () => {
        // Override the default mock for this specific test
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            user: null,
            role: null
        });

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        expect(screen.getByText('Guest User')).toBeInTheDocument();
        expect(screen.getByText('No Role')).toBeInTheDocument();
        expect(screen.getByText('U')).toBeInTheDocument(); // Default initial
    });

    it('should handle API get failure silently', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('API Error'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Failed to load notifications');
        });
        consoleSpy.mockRestore();
    });

    it('should register user with socket upon connection', async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        // Find the 'connect' event listener and call it
        const connectCall = mockSocket.on.mock.calls.find(call => call[0] === 'connect');
        expect(connectCall).toBeDefined();
        
        // Trigger the connect callback
        connectCall[1]();
        
        expect(mockSocket.emit).toHaveBeenCalledWith('register', '1');
    });

    it('should handle new_notification socket event', async () => {
        const { io } = await import('socket.io-client');
        const mockSocket = io();
        const { toast } = await import('react-toastify');

        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        // Find the 'new_notification' event listener and call it
        const newNotifCall = mockSocket.on.mock.calls.find(call => call[0] === 'new_notification');
        expect(newNotifCall).toBeDefined();
        
        // Trigger the callback with a mock notification
        const mockNotif = { id: 2, title: 'Live Test', message: 'Live Message', read: false, time: new Date().toISOString() };
        // React batching requires act here to avoid warnings
        const { act } = await import('@testing-library/react');
        act(() => {
            newNotifCall[1](mockNotif);
        });
        
        expect(toast.info).toHaveBeenCalledWith('Live Message', { position: 'bottom-right' });
        
        // Verify it updates the UI
        const bellButton = screen.getAllByRole('button')[1];
        fireEvent.click(bellButton);
        expect(screen.getByText('Live Test')).toBeInTheDocument();
        expect(screen.getByText('Live Message')).toBeInTheDocument();
    });

    it('should close dropdown when clicking Account Settings link', () => {
        render(
            <MemoryRouter>
                <Navbar onMenuClick={() => { }} />
            </MemoryRouter>
        );

        const profileButton = screen.getByText('JD').closest('button');
        fireEvent.click(profileButton);

        const accountSettingsLink = screen.getByText('Account Settings');
        fireEvent.click(accountSettingsLink);

        expect(screen.queryByText('Account Settings')).not.toBeInTheDocument();
    });
});
