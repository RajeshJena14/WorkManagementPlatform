import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Settings from '../Settings';
import * as reactRedux from 'react-redux';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';

vi.mock('react-redux', () => ({ useSelector: vi.fn(), useDispatch: vi.fn() }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../context/ThemeContext', () => ({ useTheme: vi.fn() }));

const mockSocketOn = vi.fn((event, callback) => {
    if (event === 'connect') callback();
});
const mockSocketEmit = vi.fn();
const mockSocketDisconnect = vi.fn();
vi.mock('socket.io-client', () => ({
    io: () => ({ on: mockSocketOn, emit: mockSocketEmit, disconnect: mockSocketDisconnect })
}));

describe('Settings Component', () => {
    const mockToggleTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            user: { id: 1, name: 'John', email: 'j@j.com', phone: '123' }
        });
        vi.mocked(useTheme).mockReturnValue({ isDarkMode: false, toggleTheme: mockToggleTheme });
    });

    it('should render form pre-filled with user data', () => {
        render(<Settings />);
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('j@j.com')).toBeInTheDocument();
    });

    it('should trigger theme toggle when switch is clicked', () => {
        render(<Settings />);
        fireEvent.click(screen.getByRole('switch', { name: 'Toggle dark mode' }));
        expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should show error if new passwords do not match', async () => {
        render(<Settings />);
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'pass456' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('New passwords do not match!');
            expect(mockSocketEmit).not.toHaveBeenCalled();
        });
    });

    it('should submit successfully and emit socket notification WITH password change', async () => {
        render(<Settings />);
        fireEvent.change(screen.getByLabelText(/^New Password/i), { target: { value: 'pass123' } });
        fireEvent.change(screen.getByLabelText(/Confirm New Password/i), { target: { value: 'pass123' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Settings updated successfully!');
            expect(mockSocketEmit).toHaveBeenCalledWith('self_notification', expect.objectContaining({
                userId: 1, title: 'Account Settings Updated'
            }));
        });
    });

    it('should submit successfully WITHOUT changing password', async () => {
        render(<Settings />);
        // Only change the name, leave passwords blank
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Smith' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith('Settings updated successfully!');
            expect(mockSocketEmit).toHaveBeenCalled();
        });
    });

    it('should render empty form if user properties are null', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            user: { id: 1, name: null, email: null, phone: null }
        });
        render(<Settings />);
        expect(screen.getByLabelText(/Full Name/i)).toHaveValue('');
        expect(screen.getByLabelText(/Email Address/i)).toHaveValue('');
    });

    it('should verify toggle dark mode aria-checked and class updates', () => {
        vi.mocked(useTheme).mockReturnValue({ isDarkMode: true, toggleTheme: vi.fn() });
        render(<Settings />);
        const switchBtn = screen.getByRole('switch', { name: 'Toggle dark mode' });
        expect(switchBtn).toHaveAttribute('aria-checked', 'true');
        expect(switchBtn).toHaveClass('bg-blue-600');
    });
});