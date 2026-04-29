import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const ProjectForm = ({ onSubmit, onCancel, initialData = null, systemUsers = [] }) => {
    const [projectForm, setProjectForm] = useState({ title: '', description: '', deadline: '' });
    const [projectTasks, setProjectTasks] = useState([{ id: Date.now(), title: '', type: 'Feature', assigneeId: '', assigneeName: '' }]);

    // If Edit Mode, populate the fields
    useEffect(() => {
        if (initialData) {
            setProjectForm({
                title: initialData.title || '',
                description: initialData.description || '',
                deadline: initialData.deadline ? initialData.deadline.split('T')[0] : ''
            });
        }
    }, [initialData]);

    const handleAddTaskField = () => setProjectTasks([...projectTasks, { id: Date.now(), title: '', type: 'Feature', assigneeId: '', assigneeName: '' }]);
    const handleRemoveTaskField = (id) => setProjectTasks(projectTasks.filter(t => t.id !== id));

    const handleTaskChange = (id, field, value) => {
        setProjectTasks(projectTasks.map(t => {
            if (t.id === id) {
                let updatedTask = { ...t, [field]: value };
                if (field === 'assigneeId') {
                    const selectedUser = systemUsers.find(u => u.id === value);
                    updatedTask.assigneeName = selectedUser ? selectedUser.name : '';
                }
                return updatedTask;
            }
            return t;
        }));
    };

    const submitProject = (e) => {
        e.preventDefault();
        if (!projectForm.title) return toast.error('Project title is required');

        // Extract valid tasks ONLY if creating a new project
        const validTasks = !initialData ? projectTasks.filter(t => t.title.trim() !== '') : [];

        onSubmit({
            title: projectForm.title,
            description: projectForm.description,
            deadline: projectForm.deadline || null,
            tasks: validTasks
        });
    };

    const inputClasses = "appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm";

    return (
        <form onSubmit={submitProject} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Project Name <span className="text-red-500">*</span></label>
                <input type="text" value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} className={`mt-1 ${inputClasses}`} required placeholder="e.g., Q4 Marketing Campaign" />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <textarea rows="3" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} className={`mt-1 ${inputClasses}`} placeholder="High-level goals..." />
            </div>

            {/* 1. THE NEW TARGET DEADLINE FIELD */}
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Target Deadline</label>
                <input type="date" value={projectForm.deadline} onChange={(e) => setProjectForm({ ...projectForm, deadline: e.target.value })} className={`mt-1 ${inputClasses}`} />
            </div>

            {/* ONLY SHOW TASKS SECTION IF CREATING A NEW PROJECT */}
            {!initialData && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Project Tasks (Optional)</h4>
                    {projectTasks.map((task) => (
                        <div key={task.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md mb-3 border border-slate-200 dark:border-slate-700 relative">
                            {projectTasks.length > 1 && (
                                <button type="button" onClick={() => handleRemoveTaskField(task.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <div className="space-y-3 mt-1">
                                <input type="text" value={task.title} onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)} className={inputClasses} placeholder="Task title..." />

                                <div className="flex gap-2">
                                    <select value={task.type} onChange={(e) => handleTaskChange(task.id, 'type', e.target.value)} className={`w-1/3 ${inputClasses}`}>
                                        <option value="Feature">Feature</option>
                                        <option value="Bug">Bug</option>
                                        <option value="Improvement">Improvement</option>
                                    </select>

                                    <select value={task.assigneeId} onChange={(e) => handleTaskChange(task.id, 'assigneeId', e.target.value)} className={`w-2/3 ${inputClasses}`}>
                                        <option value="">Assign to (Self)</option>
                                        {systemUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button type="button" onClick={handleAddTaskField} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 mt-2">
                        <Plus size={16} /> Add another task
                    </button>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    {initialData ? 'Update Project' : 'Dispatch Project'}
                </button>
            </div>
        </form>
    );
};

export default ProjectForm;