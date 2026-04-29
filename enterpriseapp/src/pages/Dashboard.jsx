import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, CheckCircle, Clock, LayoutDashboard, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import Modal from '../components/Modal';
import ProjectForm from '../features/ProjectForm';

const Dashboard = () => {
    const { user, role } = useSelector((state) => state.auth);

    const [dashboardData, setDashboardData] = useState({ totalProjects: 0, activeTasks: 0, pendingTasks: 0, completedTasks: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [systemUsers, setSystemUsers] = useState([]); // To populate dropdowns
    const [activities, setActivities] = useState([]); // 1. Added activities state

    // Modal State
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [projectForm, setProjectForm] = useState({ title: '', description: '' });
    const [projectTasks, setProjectTasks] = useState([{ id: Date.now(), title: '', type: 'Feature', assigneeId: '', assigneeName: '' }]);

    const fetchDashboardStats = async () => {
        setIsLoading(true);

        try {
            const [projectsRes, tasksRes] = await Promise.all([
                api.get('/projects'),
                api.get('/tasks')
            ]);

            const tasks = tasksRes.data;

            // SAFEGUARD: Added optional chaining (?.) and fallback to 0
            setDashboardData({
                totalProjects: Array.isArray(projectsRes.data) ? projectsRes.data.length : 0,
                pendingTasks: tasks.pending?.length || 0,
                activeTasks: tasks.inProgress?.length || 0,
                completedTasks: tasks.completed?.length || 0,
            });
        } catch (error) {
            toast.error('Failed to load primary dashboard statistics.');
        }

        if (role === 'Manager' || role === 'Admin') {
            try {
                const usersRes = await api.get('/users');

                // FILTER: Only keep users who have the 'Employee' role
                const employeesOnly = usersRes.data.filter(u => u.role === 'Employee');

                setSystemUsers(employeesOnly);
            } catch (error) {
                console.error('Could not load system users for dropdown:', error);
            }
        }

        // 2. Fetch Activity Feed
        try {
            const activityRes = await api.get('/system/activities');
            setActivities(activityRes.data);
        } catch (error) {
            console.error('Could not load activity feed:', error);
        }

        setIsLoading(false);
    };

    useEffect(() => { fetchDashboardStats(); }, [role]);

    // --- Modal Logic ---
    /*
    const handleAddTaskField = () => {
        setProjectTasks([...projectTasks, { id: Date.now(), title: '', type: 'Feature', assigneeId: '', assigneeName: '' }]);
    };

    const handleRemoveTaskField = (id) => {
        setProjectTasks(projectTasks.filter(t => t.id !== id));
    };

    const handleTaskChange = (id, field, value) => {
        setProjectTasks(projectTasks.map(t => {
            if (t.id === id) {
                let updatedTask = { ...t, [field]: value };
                // If changing assignee, automatically set the assigneeName as well
                if (field === 'assigneeId') {
                    const selectedUser = systemUsers.find(u => u.id === value);
                    updatedTask.assigneeName = selectedUser ? selectedUser.name : '';
                }
                return updatedTask;
            }
            return t;
        }));
    };
    */

    const submitProject = async (projectData) => {
        // projectData is handed up from ProjectForm.jsx, fully validated and filtered!
        try {
            await api.post('/projects', projectData);

            toast.success('Project and tasks dispatched successfully!');
            setIsProjectModalOpen(false); // Close the modal
            fetchDashboardStats();        // Refresh the dashboard numbers
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create project.');
        }
    };

    // const inputClasses = "appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white sm:text-sm";

    if (isLoading) return <div className="p-6 text-slate-500">Loading analytics...</div>;

    const stats = [
        { title: 'Total Projects', value: dashboardData.totalProjects, icon: Briefcase, color: 'bg-blue-500' },
        { title: 'Active Tasks', value: dashboardData.activeTasks, icon: LayoutDashboard, color: 'bg-indigo-500' },
        { title: 'Pending Tasks', value: dashboardData.pendingTasks, icon: Clock, color: 'bg-yellow-500' },
        { title: 'Completed Tasks', value: dashboardData.completedTasks, icon: CheckCircle, color: 'bg-emerald-500' },
    ];

    // Dynamically generate the last 5 days for the chart
    const chartData = Array.from({ length: 5 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (4 - i)); // Go back 4 days, 3 days... up to today
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

        // For today (the last item), show the actual completed tasks. 
        // (To make historical days accurate, you would need to filter tasks by their 'updatedAt' date).
        return {
            name: dayName,
            tasks: i === 4 ? dashboardData.completedTasks : Math.floor(Math.random() * 3) // Placeholder for past days
        };
    });

    return (
        <section className="space-y-6">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Welcome back, {user?.name || 'User'}!</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Role: <span className="font-semibold text-blue-600 dark:text-blue-400">{role}</span></p>
                </div>

                {role === 'Manager' && (
                    <button
                        onClick={() => setIsProjectModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
                    >
                        + Create Project
                    </button>
                )}
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <article key={index} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                            <div className={`${stat.color} p-3 rounded-lg text-white shadow-sm`}><Icon size={24} /></div>
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.title}</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                            </div>
                        </article>
                    );
                })}
            </div>

            {/* 3. Chart & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Task Completion Overview</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#CBD5E1" opacity={0.2} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: '#F1F5F9', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1E293B', color: '#F8FAFC' }} />
                                <Bar dataKey="tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col transition-colors duration-200 h-full max-h-88">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {activities.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm italic bg-slate-50 dark:bg-slate-900/50 rounded-md border border-dashed border-slate-200 dark:border-slate-700 p-4">
                                No recent system activity.
                            </div>
                        ) : (
                            <ul className="space-y-4">
                                {activities.map((activity) => (
                                    <li key={activity.id} className="relative pl-4 border-l-2 border-blue-500">
                                        <div className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-800"></div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{activity.title}</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{activity.description}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium tracking-wider">
                                            {new Date(activity.createdAt).toLocaleString()}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            </div>

            {/* CREATE PROJECT MODAL */}
            <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)}>
                <div className="w-full max-w-lg">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Create Workspace Project</h3>
                    <ProjectForm
                        systemUsers={systemUsers}
                        onSubmit={submitProject}
                        onCancel={() => setIsProjectModalOpen(false)}
                    />
                </div>
            </Modal>
        </section>
    );
};

export default Dashboard;