import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import App from './App';
import api from './services/api';

// We need a real Redux store to test the actual flow from Login to Dashboard
import authReducer from './store/slices/authSlice'; 

// 1. Mock the API to intercept network requests
vi.mock('./services/api', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    }
}));

// 2. Mock external libraries that crash JSDOM (Recharts, Sockets, Toastify)
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
    BarChart: () => <div />, Bar: () => <div />, XAxis: () => <div />, YAxis: () => <div />, CartesianGrid: () => <div />, Tooltip: () => <div />,
}));

vi.mock('socket.io-client', () => ({
    io: () => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })
}));

vi.mock('react-toastify', () => ({
    toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
    ToastContainer: () => <div />
}));

describe('Master User Flow Integration', () => {
    let store;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Create a fresh, real Redux store before the test
        store = configureStore({
            reducer: { auth: authReducer }
        });

        // Set up our API Interceptors for the entire flow
        vi.mocked(api.post).mockImplementation((url, data) => {
            if (url === '/auth/login' || url.includes('login')) {
                // Simulate successful Manager login
                return Promise.resolve({
                    data: { token: 'mock-jwt-token', user: { id: 'm1', name: 'Test Manager', email: 'manager@test.com', role: 'Manager' } }
                });
            }
            if (url === '/projects') {
                // Simulate successful project creation
                return Promise.resolve({ data: { message: 'Project Created' } });
            }
            return Promise.resolve({ data: {} });
        });

        vi.mocked(api.get).mockImplementation((url) => {
            // Provide data for the Dashboard to render successfully
            if (url === '/projects') return Promise.resolve({ data: [] });
            if (url === '/tasks') return Promise.resolve({ data: { pending: [], inProgress: [], completed: [] } });
            if (url === '/system/activities') return Promise.resolve({ data: [] });
            if (url === '/system/notifications') return Promise.resolve({ data: [] });
            if (url === '/users') return Promise.resolve({ 
                // Return an employee so the Manager can assign them a task
                data: [{ id: 'e1', name: 'Alice Employee', role: 'Employee' }] 
            });
            return Promise.resolve({ data: [] });
        });
    });

    it('simulates full flow: Login -> Dashboard -> Create Project -> Assign Task', async () => {
        // 1. Mount the entire application
        window.history.pushState({}, 'Test page', '/login');
        render(
            <Provider store={store}>
                <App />
            </Provider>
        );

        // --- STEP 1: THE LOGIN ---
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        
        // User types credentials
        fireEvent.change(screen.getByLabelText(/Email address/i), { target: { value: 'manager@test.com' } });
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
        
        // User clicks Sign in
        fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

        // --- STEP 2: REDIRECT TO DASHBOARD ---
        // Wait for the Redux state to update and React Router to navigate us to /dashboard
        await waitFor(() => {
            expect(screen.getByText('Welcome back, Test Manager!')).toBeInTheDocument();
        });

        // Verify the background API calls happened for the dashboard
        expect(api.get).toHaveBeenCalledWith('/projects');
        expect(api.get).toHaveBeenCalledWith('/users'); // Fetched employees for dropdowns

        // --- STEP 3: OPEN PROJECT MODAL ---
        const createProjectBtn = screen.getByText('+ Create Project');
        fireEvent.click(createProjectBtn);

        // Ensure the modal opened
        expect(screen.getByText('Create Workspace Project')).toBeInTheDocument();

        // --- STEP 4: FILL OUT PROJECT AND ASSIGN TASK ---
        // Fill out Project Details
        fireEvent.change(screen.getByPlaceholderText('e.g., Q4 Marketing Campaign'), { 
            target: { value: 'Q4 Website Launch' } 
        });

        // Fill out Task Details (The first task field is rendered by default)
        fireEvent.change(screen.getByPlaceholderText('Task title...'), { 
            target: { value: 'Design Homepage' } 
        });

        // Select 'Alice Employee' from the Assignee dropdown
        // (Finding the right combobox since there are two: Type and Assignee)
        const selects = screen.getAllByRole('combobox');
        const assigneeDropdown = selects[1]; 
        
        fireEvent.change(assigneeDropdown, { target: { value: 'e1' } }); // 'e1' is Alice's ID from our mock

        // --- STEP 5: DISPATCH ---
        fireEvent.click(screen.getByRole('button', { name: 'Dispatch Project' }));

        // --- STEP 6: VERIFY FINAL API PAYLOAD ---
        // We must wait for the exact POST request to go to the backend
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/projects', expect.objectContaining({
                title: 'Q4 Website Launch',
                tasks: expect.arrayContaining([
                    expect.objectContaining({
                        title: 'Design Homepage',
                        assigneeId: 'e1',
                        assigneeName: 'Alice Employee' // Verifies our frontend mapped the ID to the name properly!
                    })
                ])
            }));
        });
    });
});
