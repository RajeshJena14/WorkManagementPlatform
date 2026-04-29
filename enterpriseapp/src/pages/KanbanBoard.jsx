import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Calendar, AlertCircle, Edit2, Trash2, Paperclip, MessageSquare } from 'lucide-react';
import Modal from '../components/Modal';
import TaskForm from '../features/TaskForm';
import api from '../services/api';

const KanbanBoard = () => {
    const { user, role } = useSelector((state) => state.auth);

    const [columns, setColumns] = useState({ pending: [], inProgress: [], completed: [] });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Track which task is currently being edited
    const [editingTask, setEditingTask] = useState(null);

    const fetchTasks = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/tasks');
            setColumns(response.data);
        } catch (error) {
            toast.error('Failed to load tasks from the server.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchTasks(); }, []);

    // Drag and Drop Logic
    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const previousColumns = { ...columns };
        const sourceColumn = [...columns[source.droppableId]];
        const destColumn = [...columns[destination.droppableId]];
        const [movedTask] = sourceColumn.splice(source.index, 1);

        movedTask.status = destination.droppableId;
        destColumn.splice(destination.index, 0, movedTask);

        setColumns({ ...columns, [source.droppableId]: sourceColumn, [destination.droppableId]: destColumn });

        try {
            await api.patch(`/tasks/${draggableId}/status`, { status: destination.droppableId });
        } catch (error) {
            setColumns(previousColumns);
            toast.error(error.response?.data?.message || 'Access denied.');
        }
    };

    // --- CRUD Operations ---

    const openCreateModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDeleteTask = async (taskId, columnId) => {
        if (!window.confirm("Are you sure you want to delete this task permanently?")) return;

        try {
            await api.delete(`/tasks/${taskId}`);
            setColumns(prev => ({
                ...prev,
                [columnId]: prev[columnId].filter(task => task.id !== taskId)
            }));
            toast.success('Task deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete task');
        }
    };

    const handleTaskSubmit = async (data) => {
        try {
            if (editingTask) {
                // EDIT LOGIC
                await api.patch(`/tasks/${editingTask.id}/details`, data);
                toast.success('Task updated successfully!');
                fetchTasks(); // Refresh to get the latest data
            } else {
                // CREATE LOGIC
                const response = await api.post('/tasks', data);
                setColumns(prev => ({ ...prev, pending: [response.data.task, ...prev.pending] }));
                toast.success('Task created successfully!');
            }
            setIsModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save task.');
        }
    };

    // --- UI Helpers ---

    const getBadgeColor = (type) => {
        if (type === 'Bug') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
        if (type === 'Feature') return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    };

    const getPriorityColor = (priority) => {
        if (priority === 'High') return 'text-red-500';
        if (priority === 'Medium') return 'text-amber-500';
        return 'text-blue-500';
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

    if (isLoading) return <div className="flex h-full items-center justify-center text-slate-500">Loading your board...</div>;

    return (
        <section className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Project Board</h2>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                    + Add Task
                </button>
            </header>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                    {Object.entries(columns).map(([columnId, tasks]) => (
                        <div key={columnId} className="min-w-[300px] w-80 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-4 flex flex-col border border-transparent dark:border-slate-800">
                            <h3 className="font-semibold text-slate-700 dark:text-slate-300 capitalize mb-4">
                                {columnId.replace(/([A-Z])/g, ' $1').trim()} ({tasks.length})
                            </h3>

                            <Droppable droppableId={columnId}>
                                {(provided, snapshot) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 rounded-md p-1 min-h-[150px] ${snapshot.isDraggingOver ? 'bg-slate-200 dark:bg-slate-800' : ''}`}>

                                        {tasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <article
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`bg-white dark:bg-slate-800 p-4 rounded-md shadow-sm mb-3 border relative group ${snapshot.isDragging ? 'shadow-lg border-blue-400 dark:border-blue-500' : 'border-slate-200 dark:border-slate-700'}`}
                                                    >
                                                        {/* Floating Action Menu (Appears on Hover) */}
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-800 p-1 rounded-md shadow-sm border border-slate-100 dark:border-slate-700 z-10">
                                                            <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Edit Task">
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteTask(task.id, columnId)} className="p-1 text-slate-400 hover:text-red-500 transition-colors" title="Delete Task">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>

                                                        {/* Task Content */}
                                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-2 pr-8">{task.title}</p>

                                                        <div className="flex items-center gap-3 mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                                                            {task.attachments && task.attachments.length > 0 && (
                                                                <span className="flex items-center gap-1" title={`${task.attachments.length} Attachments`}>
                                                                    <Paperclip size={14} /> {task.attachments.length}
                                                                </span>
                                                            )}
                                                            {task.comments && task.comments.length > 0 && (
                                                                <span className="flex items-center gap-1" title={`${task.comments.length} Comments`}>
                                                                    <MessageSquare size={14} /> {task.comments.length}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Details Row: Priority & Due Date */}
                                                        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500 dark:text-slate-400">
                                                            {task.priority && (
                                                                <span className={`flex items-center gap-1 font-medium ${getPriorityColor(task.priority)}`}>
                                                                    <AlertCircle size={12} /> {task.priority}
                                                                </span>
                                                            )}
                                                            {task.dueDate && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar size={12} /> {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Footer: Badge & Avatar */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                                            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getBadgeColor(task.type)}`}>
                                                                {task.type}
                                                            </span>
                                                            <div className="flex items-center gap-1.5" title={`Assigned to: ${task.assigneeName || 'Unknown'}`}>
                                                                <div className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold border border-white dark:border-slate-800">
                                                                    {getInitials(task.assigneeName)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </article>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="w-full max-w-md">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                        {editingTask ? 'Edit Task' : 'Create New Task'}
                    </h3>
                    <TaskForm
                        initialData={editingTask}
                        onSubmit={handleTaskSubmit}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>
        </section>
    );
};

export default KanbanBoard;