import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Edit2, Trash2, Calendar, User } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import ProjectForm from '../features/ProjectForm';

const Projects = () => {
    const { role } = useSelector((state) => state.auth);
    const [projects, setProjects] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    const fetchProjects = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/projects');
            setProjects(response.data);

            // Fetch system users for the dropdowns when creating/editing a project
            if (role === 'Manager' || role === 'Admin') {
                const usersRes = await api.get('/users');
                const employeesOnly = usersRes.data.filter(u => u.role === 'Employee');
                setSystemUsers(employeesOnly);
            }
        } catch (error) {
            toast.error('Failed to load projects or users');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleEdit = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("WARNING: Deleting a project will also delete all tasks associated with it. Continue?")) return;
        try {
            await api.delete(`/projects/${id}`);
            setProjects(projects.filter(p => p.id !== id));
            toast.success('Project and associated tasks removed.');
        } catch (error) {
            toast.error('Failed to delete project.');
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingProject) {
                await api.patch(`/projects/${editingProject.id}`, data);
                toast.success('Project updated!');
            } else {
                await api.post('/projects', data);
                toast.success('Project created!');
            }
            setIsModalOpen(false);
            fetchProjects();
        } catch (error) {
            toast.error('Error saving project.');
        }
    };

    if (isLoading) return <div className="p-6 text-slate-500">Loading projects...</div>;

    return (
        <section className="space-y-6">
            <header className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Project Center</h2>
                {role === 'Manager' && (
                    <button
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                        + New Project
                    </button>
                )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative group">

                        {/* Manager Actions */}
                        {(role === 'Manager' || role === 'Admin') && (
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(project)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                    <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDelete(project.id)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{project.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{project.description}</p>

                        <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Calendar size={14} />
                                <span>Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No Deadline'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <User size={14} />
                                <span>Owner: {project.creatorName || 'Manager'}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
                        No projects found.
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="w-full max-w-lg">
                    <h3 className="text-xl font-bold mb-4">{editingProject ? 'Edit Project' : 'Create Project'}</h3>
                    <ProjectForm
                        initialData={editingProject}
                        systemUsers={systemUsers} // Pass the users for the dropdown
                        onSubmit={handleSubmit}
                        onCancel={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>
        </section>
    );
};

export default Projects;