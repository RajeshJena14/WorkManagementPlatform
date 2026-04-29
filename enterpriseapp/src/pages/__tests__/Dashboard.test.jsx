import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../Dashboard';
import * as reactRedux from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Mocks
vi.mock('react-redux', () => ({ useSelector: vi.fn() }));
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
}));

// Mock ProjectForm to isolate Dashboard logic
vi.mock('../../features/ProjectForm', () => ({
    default: ({ onSubmit, onCancel }) => (
        <div data-testid="mock-project-form">
            <button onClick={() => onSubmit({ title: 'New Mock Project' })}>Submit Mock Form</button>
            <button onClick={onCancel}>Cancel Mock Form</button>
        </div>
    )
}));

describe('Dashboard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Admin User' }, role: 'Admin' });

        // Default API responses
        vi.mocked(api.get).mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve({ data: [{ id: 1 }, { id: 2 }] });
            if (url === '/tasks') return Promise.resolve({
                data: { pending: [{ id: 1 }], inProgress: [{ id: 2 }, { id: 3 }], completed: [{ id: 4 }] }
            });
            if (url === '/users') return Promise.resolve({ data: [{ id: 1, role: 'Employee', name: 'Emp 1' }] });
            if (url === '/system/activities') return Promise.resolve({
                data: [{ id: 1, title: 'Test Activity', description: 'Test Desc', createdAt: new Date().toISOString() }]
            });
            return Promise.resolve({ data: [] });
        });
    });

    it('should show loading state initially', () => {
        render(<Dashboard />);
        expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('should render dashboard data after loading', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        expect(screen.getByText('Welcome back, Admin User!')).toBeInTheDocument();
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getAllByText('2').length).toBeGreaterThan(0);
        expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
    });

    it('should render Create Project button for Manager', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Manager User' }, role: 'Manager' });
        render(<Dashboard />);
        await waitFor(() => expect(screen.getByText('+ Create Project')).toBeInTheDocument());
    });

    it('should NOT render Create Project button for Employee', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Emp User' }, role: 'Employee' });
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('+ Create Project')).not.toBeInTheDocument());
    });

    it('should handle primary API errors gracefully (Projects/Tasks)', async () => {
        vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error')); // Fail first call
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        expect(toast.error).toHaveBeenCalledWith('Failed to load primary dashboard statistics.');
        expect(screen.getByText('Total Projects')).toBeInTheDocument();
        expect(screen.getAllByText('0').length).toBeGreaterThan(0); // Fallback applied
    });

    it('should handle secondary API errors silently (Users/Activities)', async () => {
        // Intercept specific secondary routes to fail
        vi.mocked(api.get).mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve({ data: [] });
            if (url === '/tasks') return Promise.resolve({ data: { pending: [], inProgress: [], completed: [] } });
            if (url === '/users') return Promise.reject(new Error('Users fail'));
            if (url === '/system/activities') return Promise.reject(new Error('Activities fail'));
            return Promise.resolve({ data: [] });
        });

        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        // It should render "No recent system activity." because activities failed
        expect(screen.getByText('No recent system activity.')).toBeInTheDocument();
        // It should NOT show the primary error toast
        expect(toast.error).not.toHaveBeenCalled();
    });

    it('should open and close modal without submitting', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Manager User' }, role: 'Manager' });
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Create Project'));
        expect(screen.getByText('Create Workspace Project')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel Mock Form'));
        expect(screen.queryByText('Create Workspace Project')).not.toBeInTheDocument();
    });

    it('should submit new project, close modal, and refresh stats', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Manager User' }, role: 'Manager' });
        vi.mocked(api.post).mockResolvedValue({});
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        api.get.mockClear(); // Clear initial load calls

        fireEvent.click(screen.getByText('+ Create Project'));
        fireEvent.click(screen.getByText('Submit Mock Form'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/projects', { title: 'New Mock Project' });
            expect(toast.success).toHaveBeenCalledWith('Project and tasks dispatched successfully!');
            expect(screen.queryByText('Create Workspace Project')).not.toBeInTheDocument(); // Closed
            expect(api.get).toHaveBeenCalledWith('/projects'); // Refetched stats
        });
    });

    it('should handle project submission failure', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Manager User' }, role: 'Manager' });
        vi.mocked(api.post).mockRejectedValue(new Error('API Error'));
        render(<Dashboard />);
        await waitFor(() => expect(screen.queryByText('Loading analytics...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Create Project'));
        fireEvent.click(screen.getByText('Submit Mock Form'));

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith('Failed to create project.');
            expect(screen.getByText('Create Workspace Project')).toBeInTheDocument(); // Modal stays open
        });
    });
});