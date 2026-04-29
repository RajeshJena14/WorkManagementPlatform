import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskForm from './TaskForm';
import * as reactRedux from 'react-redux';

// Mock Redux to provide the user for comments
vi.mock('react-redux', () => ({
    useSelector: vi.fn()
}));

describe('TaskForm Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: { name: 'John Doe' } });
    });

    it('should render default fields in Create Mode', () => {
        render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Due Date/i)).toBeInTheDocument();

        // Attachments should exist, Comments should NOT exist in Create Mode
        expect(screen.getByText(/Attachments/i)).toBeInTheDocument();
        expect(screen.queryByText(/Activity & Comments/i)).not.toBeInTheDocument();
    });

    it('should show validation errors on empty submit', async () => {
        const mockSubmit = vi.fn();
        render(<TaskForm onSubmit={mockSubmit} onCancel={vi.fn()} />);

        fireEvent.submit(screen.getByRole('button', { name: 'Save Task' }));

        // RHF errors are async
        await waitFor(() => {
            expect(screen.getByText('Task title is required')).toBeInTheDocument();
            expect(screen.getByText('Description is required')).toBeInTheDocument();
            expect(mockSubmit).not.toHaveBeenCalled();
        });
    });

    it('should populate fields, arrays, and show comments in Edit Mode', () => {
        const initialData = {
            title: 'Fix Login',
            description: 'Broken API',
            dueDate: '2026-05-01T00:00:00Z',
            attachments: [{ id: 'f1', fileName: 'log.txt', size: '12 KB' }],
            comments: [{ id: 'c1', text: 'Working on it', authorName: 'Alice', createdAt: new Date().toISOString() }]
        };

        render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} initialData={initialData} />);

        expect(screen.getByDisplayValue('Fix Login')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2026-05-01')).toBeInTheDocument();

        // Arrays loaded
        expect(screen.getByText('log.txt (12 KB)')).toBeInTheDocument();
        expect(screen.getByText('Activity & Comments')).toBeInTheDocument();
        expect(screen.getByText('Working on it')).toBeInTheDocument();
    });

    it('should upload a mock attachment and allow removing it', () => {
        render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

        // Find the hidden file input
        const fileInput = document.querySelector('input[type="file"]');

        // Mock a file object
        const mockFile = new File(['mock content'], 'design.png', { type: 'image/png' });
        // Setting size manually for test since jsdom File objects are tricky
        Object.defineProperty(mockFile, 'size', { value: 1024 * 50 }); // 50 KB

        fireEvent.change(fileInput, { target: { files: [mockFile] } });

        // Verify it appeared in UI
        expect(screen.getByText('design.png (50.0 KB)')).toBeInTheDocument();

        // Remove it
        const removeBtns = screen.getAllByRole('button').filter(b => b.querySelector('svg'));
        // Click the first button that has an SVG (which should be the 'X' button for the file)
        fireEvent.click(removeBtns[0]);

        expect(screen.queryByText('design.png (50.0 KB)')).not.toBeInTheDocument();
    });

    it('should add a comment via button and via Enter key', () => {
        // Must provide initialData so the comment section appears
        render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} initialData={{ title: 'T', description: 'D' }} />);

        const input = screen.getByPlaceholderText('Write a comment...');
        const sendButton = screen.getAllByRole('button')[0]; // First button in form

        // 1. Add via Button
        fireEvent.change(input, { target: { value: 'First Comment' } });
        fireEvent.click(sendButton);
        expect(screen.getByText('First Comment')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument(); // Verifies Redux auth injection

        // 2. Add via Enter Key
        fireEvent.change(input, { target: { value: 'Second Comment' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(screen.getByText('Second Comment')).toBeInTheDocument();

        // 3. Prevent Empty Comments
        fireEvent.change(input, { target: { value: '   ' } });
        fireEvent.click(sendButton);
        // Still only 2 user comments + 1 "Activity & Comments" label = 3 total matches
        expect(screen.getAllByText(/Comment/).length).toBe(3);
    });

    it('should submit valid form data merged with attachments and comments', async () => {
        const mockSubmit = vi.fn();
        render(<TaskForm onSubmit={mockSubmit} onCancel={vi.fn()} initialData={{ title: 'Old', description: 'Old' }} />);

        // Add a comment
        fireEvent.change(screen.getByPlaceholderText('Write a comment...'), { target: { value: 'Final review' } });
        fireEvent.keyDown(screen.getByPlaceholderText('Write a comment...'), { key: 'Enter' });

        // Submit Form
        fireEvent.submit(screen.getByRole('button', { name: 'Save Changes' }));

        await waitFor(() => {
            expect(mockSubmit).toHaveBeenCalledTimes(1);
            const submittedData = mockSubmit.mock.calls[0][0];

            // Core data checks
            expect(submittedData.title).toBe('Old');
            expect(submittedData.priority).toBe('Medium');
            // Custom Array checks
            expect(submittedData.comments.length).toBe(1);
            expect(submittedData.comments[0].text).toBe('Final review');
            expect(Array.isArray(submittedData.attachments)).toBe(true);
        });
    });

    it('should call onCancel', () => {
        const mockCancel = vi.fn();
        render(<TaskForm onSubmit={vi.fn()} onCancel={mockCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(mockCancel).toHaveBeenCalledTimes(1);
    });

    it('should fallback to System User if user is missing and handle non-Enter key presses', () => {
        // Mock useSelector to return empty user object
        vi.mocked(reactRedux.useSelector).mockReturnValue({ user: null });
        
        render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} initialData={{ title: 'T', description: 'D' }} />);
        const input = screen.getByPlaceholderText('Write a comment...');
        const sendButton = screen.getAllByRole('button')[0];
        
        // 1. Press a non-Enter key (should do nothing, covers branch)
        fireEvent.keyDown(input, { key: 'Shift' });
        
        // 2. Submit comment, should fallback to "System User"
        fireEvent.change(input, { target: { value: 'Anonymous Comment' } });
        fireEvent.click(sendButton);
        
        expect(screen.getByText('System User')).toBeInTheDocument();
    });
});