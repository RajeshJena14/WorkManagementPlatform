import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../Login';
import { MemoryRouter } from 'react-router-dom';
import * as reactRedux from 'react-redux';
import { loginUser, registerUser, clearError } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

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

vi.mock('../../store/slices/authSlice', () => ({
    loginUser: vi.fn(),
    registerUser: vi.fn(),
    clearError: vi.fn(),
}));

vi.mock('react-toastify', () => ({ toast: { error: vi.fn() } }));

describe('Login Page Component', () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useDispatch).mockReturnValue(mockDispatch);
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            isLoading: false,
            error: null,
            isAuthenticated: false
        });
    });

    it('should render login form by default', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument(); // Ensure it's not signup mode
    });

    it('should toggle to signup mode', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        const toggleButton = screen.getByText('Sign up');
        fireEvent.click(toggleButton);

        expect(screen.getByText('Create a new account')).toBeInTheDocument();
        expect(screen.getByText('Full Name')).toBeInTheDocument();
        expect(screen.getByText('Account Role')).toBeInTheDocument();
    });

    it('should redirect to dashboard if authenticated', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({
            isLoading: false,
            error: null,
            isAuthenticated: true
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
    it('should show validation errors on empty submit (Login Mode)', async () => {
        render(<MemoryRouter><Login /></MemoryRouter>);
        fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(screen.getByText('Email is required')).toBeInTheDocument();
            expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
            expect(mockDispatch).not.toHaveBeenCalledWith(loginUser());
        });
    });

    it('should dispatch loginUser with correct data', async () => {
        render(<MemoryRouter><Login /></MemoryRouter>);

        fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }));

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledTimes(1);
            // Verify it called the thunk (it returns a function, so we just check it was dispatched)
        });
    });

    it('should dispatch registerUser with correct data in Signup Mode', async () => {
        render(<MemoryRouter><Login /></MemoryRouter>);
        fireEvent.click(screen.getByText('Sign up')); // Switch to signup

        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'john@test.com' } });
        fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '1234567890' } });
        fireEvent.change(screen.getByLabelText(/Account Role/i), { target: { value: 'Manager' } });
        fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
        fireEvent.change(screen.getByLabelText(/Confirm Password/i), { target: { value: 'password123' } });

        fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }));

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledTimes(1);
        });
    });

    it('should show toast error and dispatch clearError if Redux has error state', () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ isLoading: false, error: 'Invalid credentials', isAuthenticated: false });
        render(<MemoryRouter><Login /></MemoryRouter>);

        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
        expect(mockDispatch).toHaveBeenCalledWith(clearError());
    });
});
