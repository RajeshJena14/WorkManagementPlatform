import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSelector } from 'react-redux';
import { Paperclip, MessageSquare, X, Send } from 'lucide-react';

// 1. EXACT Schema restored: Includes priority and dueDate
const taskSchema = yup.object().shape({
    title: yup.string().required('Task title is required').min(3, 'Must be at least 3 characters'),
    description: yup.string().required('Description is required'),
    type: yup.string().oneOf(['Bug', 'Feature', 'Improvement']).required('Select a task type'),
    priority: yup.string().oneOf(['Low', 'Medium', 'High']).required('Select a priority'),
    dueDate: yup.string().nullable()
});

const TaskForm = ({ onSubmit, onCancel, initialData = null }) => {
    // Redux: Get the current user for comment authorship
    const { user } = useSelector((state) => state.auth);

    // Local state for the new features
    const [attachments, setAttachments] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: yupResolver(taskSchema),
        defaultValues: {
            type: 'Feature',
            priority: 'Medium',
            dueDate: ''
        }
    });

    // 2. Populate form data AND attachments/comments in Edit Mode
    useEffect(() => {
        if (initialData) {
            reset({
                title: initialData.title || '',
                description: initialData.description || '',
                type: initialData.type || 'Feature',
                priority: initialData.priority || 'Medium',
                dueDate: initialData.dueDate ? initialData.dueDate.split('T')[0] : ''
            });
            // Load existing arrays if they exist
            setAttachments(initialData.attachments || []);
            setComments(initialData.comments || []);
        }
    }, [initialData, reset]);

    // --- Mock Attachment Handlers ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newFile = { id: Date.now().toString(), fileName: file.name, size: (file.size / 1024).toFixed(1) + ' KB' };
            setAttachments([...attachments, newFile]);
        }
    };

    const removeAttachment = (id) => {
        setAttachments(attachments.filter(a => a.id !== id));
    };

    // --- Comment Handlers ---
    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const commentObj = {
            id: Date.now().toString(),
            text: newComment,
            authorName: user?.name || 'System User',
            createdAt: new Date().toISOString()
        };
        setComments([...comments, commentObj]);
        setNewComment('');
    };

    // --- Final Submit Handler ---
    const handleFormSubmit = (data) => {
        // Merge RHF data with our custom arrays
        onSubmit({ ...data, attachments, comments });
    };

    const inputClasses = "appearance-none mt-1 block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm transition-colors duration-200";
    const labelClasses = "block text-sm font-medium text-slate-700 dark:text-slate-300";

    return (
        <div className="w-full max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">

                {/* --- ORIGINAL FIELDS --- */}
                <div>
                    <label htmlFor="title" className={labelClasses}>Title <span className="text-red-500">*</span></label>
                    <input
                        id="title"
                        {...register('title')}
                        className={inputClasses}
                        placeholder="e.g., Update login layout"
                    />
                    {errors.title && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.title.message}</p>}
                </div>

                <div>
                    <label htmlFor="description" className={labelClasses}>Description <span className="text-red-500">*</span></label>
                    <textarea
                        id="description"
                        {...register('description')}
                        rows="3"
                        className={inputClasses}
                        placeholder="Briefly describe the task..."
                    />
                    {errors.description && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="type" className={labelClasses}>Type</label>
                        <select id="type" {...register('type')} className={inputClasses}>
                            <option value="Feature">Feature</option>
                            <option value="Bug">Bug</option>
                            <option value="Improvement">Improvement</option>
                        </select>
                        {errors.type && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.type.message}</p>}
                    </div>

                    <div>
                        <label htmlFor="priority" className={labelClasses}>Priority</label>
                        <select id="priority" {...register('priority')} className={inputClasses}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                        {errors.priority && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.priority.message}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="dueDate" className={labelClasses}>Due Date (Optional)</label>
                    <input
                        type="date"
                        id="dueDate"
                        {...register('dueDate')}
                        className={inputClasses}
                    />
                </div>

                {/* --- NEW: ATTACHMENTS SECTION --- */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <label className={`${labelClasses} mb-2 flex items-center gap-2`}>
                        <Paperclip size={16} /> Attachments
                    </label>

                    <div className="flex items-center gap-3 mb-3">
                        <label className="cursor-pointer bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <span>Browse Files...</span>
                            <input type="file" className="hidden" onChange={handleFileUpload} />
                        </label>
                    </div>

                    {attachments.length > 0 && (
                        <ul className="space-y-2">
                            {attachments.map(file => (
                                <li key={file.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="truncate pr-4">{file.fileName} ({file.size})</span>
                                    <button type="button" onClick={() => removeAttachment(file.id)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* --- NEW: COMMENTS SECTION (Only show on Edit) --- */}
                {initialData && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                        <label className={`${labelClasses} mb-3 flex items-center gap-2`}>
                            <MessageSquare size={16} /> Activity & Comments
                        </label>

                        <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                            {comments.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No comments yet.</p>
                            ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="bg-blue-50 dark:bg-slate-800 p-3 rounded-md border border-blue-100 dark:border-slate-700">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{comment.authorName}</span>
                                            <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-sm text-slate-700 dark:text-slate-300">{comment.text}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); } }}
                                className={inputClasses}
                                placeholder="Write a comment..."
                            />
                            <button type="button" onClick={handleAddComment} className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-2 rounded-md hover:bg-blue-50 text-blue-600 transition-colors">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-800"
                    >
                        {initialData ? 'Save Changes' : 'Save Task'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TaskForm;