import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KanbanBoard from '../KanbanBoard';
import * as reactRedux from 'react-redux';
import api from '../../services/api';
import { toast } from 'react-toastify';

// Mocks
vi.mock('react-redux', () => ({ useSelector: vi.fn() }));
vi.mock('../../services/api', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Mock DragDropContext
vi.mock('@hello-pangea/dnd', () => ({
    DragDropContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
    Droppable: ({ children, droppableId }) => children({
        droppableProps: { 'data-droppable-id': droppableId }, innerRef: vi.fn()
    }, { isDraggingOver: false }),
    Draggable: ({ children, draggableId, index }) => children({
        draggableProps: { 'data-draggable-id': draggableId, 'data-index': index }, dragHandleProps: {}, innerRef: vi.fn()
    }, { isDragging: false }),
}));

// Provide a mock form
vi.mock('../../features/TaskForm', () => ({
    default: ({ onSubmit, onCancel, initialData }) => (
        <div data-testid="mock-task-form">
            <button onClick={() => onSubmit({ title: 'Mock Task Data', status: 'pending' })}>Submit Mock Form</button>
            <button onClick={onCancel}>Cancel Mock Form</button>
            {initialData && <span data-testid="editing-indicator">Editing</span>}
        </div>
    )
}));

describe('KanbanBoard Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'Test User' }, role: 'Admin' });
        vi.mocked(api.get).mockResolvedValue({
            data: {
                pending: [{ id: '1', title: 'Task 1', type: 'Feature', status: 'pending', priority: 'High', assigneeName: 'John Doe' }],
                inProgress: [{ id: '2', title: 'Task 2', type: 'Bug', status: 'inProgress', priority: 'Medium', assigneeName: 'Jane Smith' }],
                completed: [{ id: '3', title: 'Task 3', type: 'Improvement', status: 'completed', priority: 'Low', assigneeName: 'Bob' }]
            }
        });
    });

    it('should show loading state initially', () => {
        render(<KanbanBoard />);
        expect(screen.getByText('Loading your board...')).toBeInTheDocument();
    });

    it('should render tasks grouped by columns and trigger all badge colors', async () => {
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        expect(screen.getByText('Task 1')).toBeInTheDocument();
        expect(screen.getByText('Task 2')).toBeInTheDocument();
        expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    it('should handle API failure on initial load', async () => {
        vi.mocked(api.get).mockRejectedValue(new Error('API Error'));
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        expect(toast.error).toHaveBeenCalledWith('Failed to load tasks from the server.');
    });

    it('should open and close modal without submitting', async () => {
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Add Task'));
        expect(screen.getByText('Create New Task')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Cancel Mock Form'));
        expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    it('should open edit modal for existing task', async () => {
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        const editButtons = screen.getAllByTitle('Edit Task');
        fireEvent.click(editButtons[0]);

        expect(screen.getByText('Edit Task')).toBeInTheDocument();
        expect(screen.getByTestId('editing-indicator')).toBeInTheDocument();
    });

    it('should abort delete if window.confirm is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        const deleteButtons = screen.getAllByTitle('Delete Task');
        fireEvent.click(deleteButtons[0]);

        expect(api.delete).not.toHaveBeenCalled();
    });

    it('should call delete API and succeed', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockResolvedValue({});
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('Delete Task')[0]);

        await waitFor(() => {
            expect(api.delete).toHaveBeenCalledWith('/tasks/1');
            expect(toast.success).toHaveBeenCalledWith('Task deleted successfully');
        });
    });

    it('should handle delete API failure', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        vi.mocked(api.delete).mockRejectedValue(new Error('API Error'));
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('Delete Task')[0]);

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete task'));
    });

    it('should submit new task successfully (POST)', async () => {
        vi.mocked(api.post).mockResolvedValue({ data: { task: { id: '4', title: 'New Task', type: 'Feature' } } });
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Add Task'));
        fireEvent.click(screen.getByText('Submit Mock Form'));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/tasks', { title: 'Mock Task Data', status: 'pending' });
            expect(toast.success).toHaveBeenCalledWith('Task created successfully!');
        });
    });

    it('should update existing task successfully (PATCH)', async () => {
        vi.mocked(api.patch).mockResolvedValue({});
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getAllByTitle('Edit Task')[0]); // Open edit
        api.get.mockClear(); // clear initial load
        fireEvent.click(screen.getByText('Submit Mock Form'));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalledWith('/tasks/1/details', { title: 'Mock Task Data', status: 'pending' });
            expect(toast.success).toHaveBeenCalledWith('Task updated successfully!');
            expect(api.get).toHaveBeenCalled(); // Should refresh board
        });
    });

    it('should handle task submit failure', async () => {
        vi.mocked(api.post).mockRejectedValue(new Error('API Error'));
        render(<KanbanBoard />);
        await waitFor(() => expect(screen.queryByText('Loading your board...')).not.toBeInTheDocument());

        fireEvent.click(screen.getByText('+ Add Task'));
        fireEvent.click(screen.getByText('Submit Mock Form'));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save task.'));
    });
});