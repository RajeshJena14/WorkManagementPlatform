import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Projects from '../Projects';
import * as reactRedux from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

vi.mock('react-redux', () => ({ useSelector: vi.fn() }));
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../../features/ProjectForm', () => ({
    default: ({ onSubmit, onCancel }) => (
        <div>
            <button onClick={() => onSubmit({ title: 'Mock Proj' })}>Submit Mock</button>
            <button onClick={onCancel}>Cancel Mock</button>
        </div>
    )
}));

describe('Projects Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Manager' });
        vi.mocked(api.get).mockImplementation((url) => {
            if (url === '/projects') return Promise.resolve({ data: [{ id: 1, title: 'Project A', description: 'Desc A' }] });
            if (url === '/users') return Promise.resolve({ data: [{ id: 1, role: 'Employee' }] });
            return Promise.resolve({ data: [] });
        });
    });

    it('should render projects and Manager controls', async () => {
        render(<Projects />);
        expect(screen.getByText('Loading projects...')).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());
        expect(screen.getByText('Project A')).toBeInTheDocument();
        expect(screen.getByText('+ New Project')).toBeInTheDocument();
    });

    it('should show "No projects found" empty state', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: [] });
        render(<Projects />);
        await waitFor(() => expect(screen.getByText('No projects found.')).toBeInTheDocument());
    });

    it('should show error toast if fetching projects fails', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('Network Error'));
        render(<Projects />);
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load projects or users'));
    });

    it('should hide + New Project and controls for Employee', async () => {
        vi.mocked(reactRedux.useSelector).mockReturnValue({ role: 'Employee' });
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('+ New Project')).not.toBeInTheDocument());
    });

    it('should abort deletion if window.confirm is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false); // User clicks Cancel
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash')));
        expect(api.delete).not.toHaveBeenCalled();
    });

    it('should handle successful project deletion', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockResolvedValue({});
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash')));
        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/projects/1');
            expect(toast.success).toHaveBeenCalledWith('Project and associated tasks removed.');
        });
    });

    it('should show error toast if deletion fails', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockRejectedValue(new Error('API Error'));
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByRole('button').find(b => b.innerHTML.includes('lucide-trash')));
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete project.'));
    });

    it('should create new project via POST', async () => {
        vi.mocked(api.post).mockResolvedValue({});
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ New Project'));
        fireEvent.click(screen.getByText('Submit Mock'));
        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/projects', { title: 'Mock Proj' });
            expect(toast.success).toHaveBeenCalledWith('Project created!');
        });
    });

    it('should update existing project via PATCH when editing', async () => {
        vi.mocked(api.patch).mockResolvedValue({});
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        // Find and click the Edit button
        fireEvent.click(screen.getAllByRole('button').find(b => b.className.includes('hover:text-blue-500')));
        fireEvent.click(screen.getByText('Submit Mock'));
        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/projects/1', { title: 'Mock Proj' });
            expect(toast.success).toHaveBeenCalledWith('Project updated!');
        });
    });

    it('should show error toast if submitting/updating fails', async () => {
        vi.mocked(api.post).mockRejectedValue(new Error('API Error'));
        render(<Projects />);
        await waitFor(() => expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ New Project'));
        fireEvent.click(screen.getByText('Submit Mock'));
        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error saving project.'));
    });
});