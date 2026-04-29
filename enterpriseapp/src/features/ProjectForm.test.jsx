import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProjectForm from './ProjectForm';
import { toast } from 'react-toastify';

vi.mock('react-toastify', () => ({
    toast: { error: vi.fn() }
}));

describe('ProjectForm Component', () => {
    const mockSystemUsers = [
        { id: 'u1', name: 'Alice', role: 'Employee' },
        { id: 'u2', name: 'Bob', role: 'Employee' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render blank form in Create Mode and show tasks section', () => {
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} systemUsers={mockSystemUsers} />);

        expect(screen.getByPlaceholderText('e.g., Q4 Marketing Campaign').value).toBe('');
        expect(screen.getByText('Project Tasks (Optional)')).toBeInTheDocument();
        // One empty task should be rendered by default
        expect(screen.getAllByPlaceholderText('Task title...').length).toBe(1);
    });

    it('should pre-fill form in Edit Mode and HIDE tasks section', () => {
        const initialData = { title: 'Old Proj', description: 'Old Desc', deadline: '2025-12-31T00:00:00Z' };
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} initialData={initialData} />);

        expect(screen.getByDisplayValue('Old Proj')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Old Desc')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument(); // Checks date splitting

        // Tasks should be hidden
        expect(screen.queryByText('Project Tasks (Optional)')).not.toBeInTheDocument();
    });

    it('should show toast error and block submit if title is empty', () => {
        const mockSubmit = vi.fn();
        render(<ProjectForm onSubmit={mockSubmit} onCancel={vi.fn()} />);

        fireEvent.submit(screen.getByRole('button', { name: 'Dispatch Project' }));

        expect(toast.error).toHaveBeenCalledWith('Project title is required');
        expect(mockSubmit).not.toHaveBeenCalled();
    });

    it('should add and remove task fields dynamically', () => {
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        // Add a task
        fireEvent.click(screen.getByText('Add another task'));
        let taskInputs = screen.getAllByPlaceholderText('Task title...');
        expect(taskInputs.length).toBe(2);

        // Remove a task (only appears if >1 task)
        const trashButtons = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
        fireEvent.click(trashButtons[0]); // Click the trash icon

        taskInputs = screen.getAllByPlaceholderText('Task title...');
        expect(taskInputs.length).toBe(1);
    });

    it('should map assigneeId to assigneeName automatically when selecting an employee', () => {
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} systemUsers={mockSystemUsers} />);

        const selectDropdowns = screen.getAllByRole('combobox');
        fireEvent.change(selectDropdowns[1], { target: { value: 'u2' } }); // Select Bob

        expect(selectDropdowns[1].value).toBe('u2');
        // The internal state now has { assigneeName: 'Bob' }, which we will verify on submit
    });

    it('should submit successfully and filter out empty tasks', () => {
        const mockSubmit = vi.fn();
        render(<ProjectForm onSubmit={mockSubmit} onCancel={vi.fn()} systemUsers={mockSystemUsers} />);

        // Fill out Project
        fireEvent.change(screen.getByPlaceholderText('e.g., Q4 Marketing Campaign'), { target: { value: 'New Project' } });

        // Fill out Task 1
        fireEvent.change(screen.getByPlaceholderText('Task title...'), { target: { value: 'Real Task' } });
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'Bug' } }); // Task Type
        fireEvent.change(selects[1], { target: { value: 'u1' } }); // Assignee (Alice)

        // Add Task 2 (Leave empty to test filter)
        fireEvent.click(screen.getByText('Add another task'));

        // Submit
        fireEvent.submit(screen.getByRole('button', { name: 'Dispatch Project' }));

        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockSubmit.mock.calls[0][0];

        expect(submittedData.title).toBe('New Project');
        expect(submittedData.tasks.length).toBe(1); // Task 2 was filtered out!
        expect(submittedData.tasks[0].title).toBe('Real Task');
        expect(submittedData.tasks[0].assigneeName).toBe('Alice'); // Verifies name mapping worked!
    });

    it('should call onCancel when Cancel button is clicked', () => {
        const mockCancel = vi.fn();
        render(<ProjectForm onSubmit={vi.fn()} onCancel={mockCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should handle changes to description, deadline and update specific tasks correctly', () => {
        const mockSubmit = vi.fn();
        render(<ProjectForm onSubmit={mockSubmit} onCancel={vi.fn()} />);

        // Update description and deadline
        fireEvent.change(screen.getByPlaceholderText('High-level goals...'), { target: { value: 'New Description' } });
        // The date input has no placeholder, we can find it by its label "Target Deadline" or just by type="date" since it's the only one.
        const dateInput = document.querySelector('input[type="date"]');
        fireEvent.change(dateInput, { target: { value: '2026-10-10' } });

        // Add a second task to test the `return t;` branch in handleTaskChange
        fireEvent.click(screen.getByText('Add another task'));
        
        const taskInputs = screen.getAllByPlaceholderText('Task title...');
        expect(taskInputs.length).toBe(2);

        // Update the FIRST task. This triggers handleTaskChange, which maps over both tasks.
        // For the first task, it updates it. For the second task, it hits the `return t;` branch.
        fireEvent.change(taskInputs[0], { target: { value: 'Task 1 Title' } });

        // Fill out title so we can submit
        fireEvent.change(screen.getByPlaceholderText('e.g., Q4 Marketing Campaign'), { target: { value: 'Title' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Dispatch Project' }));

        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockSubmit.mock.calls[0][0];
        
        expect(submittedData.description).toBe('New Description');
        expect(submittedData.deadline).toBe('2026-10-10');
        expect(submittedData.tasks[0].title).toBe('Task 1 Title');
        expect(submittedData.tasks.length).toBe(1); // Second task is filtered out because it's empty
    });

    it('should handle undefined fields in initialData', () => {
        const initialData = { title: undefined, description: undefined, deadline: undefined };
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} initialData={initialData} />);
        
        expect(screen.getByPlaceholderText('e.g., Q4 Marketing Campaign').value).toBe('');
    });

    it('should map assigneeName to empty string if user not found', () => {
        render(<ProjectForm onSubmit={vi.fn()} onCancel={vi.fn()} systemUsers={mockSystemUsers} />);

        const selectDropdowns = screen.getAllByRole('combobox');
        fireEvent.change(selectDropdowns[1], { target: { value: 'non-existent-user' } }); 

        expect(selectDropdowns[1].value).toBe(''); // Invalid option reverts to empty/default
    });

    it('should submit empty tasks array in Edit Mode', () => {
        const mockSubmit = vi.fn();
        const initialData = { title: 'Old Proj', description: 'Old Desc', deadline: '2025-12-31T00:00:00Z' };
        render(<ProjectForm onSubmit={mockSubmit} onCancel={vi.fn()} initialData={initialData} />);
        
        fireEvent.submit(screen.getByRole('button', { name: 'Update Project' }));
        
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        const submittedData = mockSubmit.mock.calls[0][0];
        expect(submittedData.tasks).toEqual([]); // validTasks is [] in edit mode
    });
});