import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import api from '../services/api';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. Fetch initial user data from database
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to fetch users.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();

        // 2. Connect to WebSocket to listen for LIVE status changes
        const socket = io('https://workmanagementplatform-production.up.railway.app');

        socket.on('user_status_change', (data) => {
            // Update the specific user's status and lastActivity in the React state instantly
            setUsers((prevUsers) => prevUsers.map(u =>
                u.id === data.userId
                    ? { ...u, status: data.status, lastActivity: data.lastActivity }
                    : u
            ));
        });

        // Cleanup on unmount
        return () => socket.disconnect();
    }, []);

    const handleRemoveUser = async (userId) => {
        if (!window.confirm("Are you sure you want to remove this user from the system?")) return;
        try {
            await api.delete(`/users/${userId}`);
            setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
            toast.info('User removed from system successfully.');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to remove user.');
        }
    };

    // Helper to format the Last Activity timestamp
    const formatLastActivity = (dateString, status) => {
        if (status === 'Online') return 'Right now';
        if (!dateString) return 'Never logged in';

        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (isLoading) return <div className="p-6 text-slate-500">Loading system users...</div>;

    return (
        <section className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-200">
            <header className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">User Management</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">View, edit, and manage system access.</p>
            </header>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Name</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Role</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400">Last Activity</th>
                            <th scope="col" className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{user.email}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2.5 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-semibold">
                                        {user.role}
                                    </span>
                                </td>

                                {/* Dynamic Status Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2.5 w-2.5 rounded-full ${user.status === 'Online' ? 'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-900/30' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                        <span className={`text-xs font-semibold ${user.status === 'Online' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {user.status || 'Offline'}
                                        </span>
                                    </div>
                                </td>

                                {/* New Last Activity Column */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-slate-500 dark:text-slate-400 text-sm">
                                        {formatLastActivity(user.lastActivity, user.status)}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <button
                                        onClick={() => handleRemoveUser(user.id)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors focus:outline-none focus:underline"
                                    >
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default UserManagement;