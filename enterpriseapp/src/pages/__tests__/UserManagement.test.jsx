import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagement from '../UserManagement';
import api from '../../services/api';
import { toast } from 'react-toastify';

vi.mock('../../services/api', () => ({ default: { get: vi.fn(), delete: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { info: vi.fn(), error: vi.fn() } }));

let mockSocketOn;
vi.mock('socket.io-client', () => ({
    io: () => {
        mockSocketOn = vi.fn();
        return { on: mockSocketOn, disconnect: vi.fn() };
    }
}));

describe('UserManagement Component', () => {
    const mockUsers = [
        { id: 1, name: 'Alice', email: 'a@a.com', role: 'Employee', status: 'Offline', lastActivity: '2026-04-29T10:00:00Z' },
        { id: 2, name: 'Bob', email: 'b@b.com', role: 'Manager', status: 'Online', lastActivity: new Date().toISOString() },
        { id: 3, name: 'Charlie', email: 'c@c.com', role: 'Employee', status: 'Offline', lastActivity: null } // Never logged in
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.get).mockResolvedValue({ data: mockUsers });
    });

    it('should render table and properly format all Last Activity states', async () => {
        render(<UserManagement />);
        await waitFor(() => expect(screen.queryByText('Loading system users...')).not.toBeInTheDocument());

        expect(screen.getByText('Alice')).toBeInTheDocument();
        // Alice has a standard date format, locale-agnostic check
        expect(screen.getByText((content) => content.includes('29') && content.includes('Apr'))).toBeInTheDocument();

        // Bob is online
        expect(screen.getByText('Right now')).toBeInTheDocument();

        // Charlie has null activity
        expect(screen.getByText('Never logged in')).toBeInTheDocument();
    });

    it('should show error toast if fetching users fails', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('API Error'));
        render(<UserManagement />);
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to fetch users.'));
    });

    it('should abort deletion if window.confirm is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<UserManagement />);
        await waitFor(() => expect(screen.queryByText('Loading system users...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Remove')[0]);
        expect(api.delete).not.toHaveBeenCalled();
    });

    it('should handle successful user deletion', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockResolvedValue({});
        render(<UserManagement />);
        await waitFor(() => expect(screen.queryByText('Loading system users...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Remove')[0]); // Delete Alice

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/users/1');
            expect(screen.queryByText('Alice')).not.toBeInTheDocument();
            expect(toast.info).toHaveBeenCalledWith('User removed from system successfully.');
        });
    });

    it('should show error toast if user deletion fails', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockRejectedValue(new Error('API Error'));
        render(<UserManagement />);
        await waitFor(() => expect(screen.queryByText('Loading system users...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByText('Remove')[0]);

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to remove user.'));
    });

    it('should update user status instantly via WebSocket event', async () => {
        render(<UserManagement />);
        await waitFor(() => expect(screen.queryByText('Loading system users...')).not.toBeInTheDocument());

        const socketCallback = mockSocketOn.mock.calls.find(call => call[0] === 'user_status_change')[1];

        // Simulate backend sending an event that Alice logged in!
        socketCallback({ userId: 1, status: 'Online', lastActivity: new Date().toISOString() });

        await waitFor(() => {
            // There should now be TWO "Right now" entries (Alice and Bob)
            const rightNowTexts = screen.getAllByText('Right now');
            expect(rightNowTexts.length).toBe(2);
        });
    });
});