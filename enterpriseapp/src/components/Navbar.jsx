import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import api from '../services/api'; // Make sure API is imported

const Navbar = ({ onMenuClick }) => {
    // Profile Dropdown State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Notification Dropdown State
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const [notifications, setNotifications] = useState([]);

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, role } = useSelector((state) => state.auth);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Fetch initial notifications from Firebase
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/system/notifications');
                setNotifications(res.data);
            } catch (error) {
                console.error('Failed to load notifications');
            }
        };
        if (user) fetchNotifications();
    }, [user]);

    // WebSocket Connection
    useEffect(() => {
        let socket;
        if (user) {
            socket = io('https://workmanagementplatform-production.up.railway.app');

            // WAITS for the connection to establish before registering!
            socket.on('connect', () => {
                socket.emit('register', user.id);
            });

            socket.on('new_notification', (data) => {
                setNotifications((prev) => [data, ...prev]);
                toast.info(data.message, { position: "bottom-right" });
            });
        }
        return () => { if (socket) socket.disconnect(); };
    }, [user]);

    // Handle clicking outside for BOTH dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    // Mark as read in Firebase
    const markAllAsRead = async () => {
        try {
            await api.patch('/system/notifications/read');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            toast.error('Failed to update notifications');
        }
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

    return (
        <header className="h-16 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between px-4 lg:px-6 z-10 relative border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">

            {/* Mobile Menu Trigger */}
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>

            <div className="flex-1"></div> {/* Spacer */}

            {/* Right Side Container */}
            <div className="flex items-center gap-5">

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus:outline-none transition-colors mt-1"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown Panel */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50 transition-colors duration-200">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400">Mark all as read</button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">No new notifications</div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={`p-4 border-b border-slate-100 dark:border-slate-700/50 text-sm ${notif.read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-slate-700/30'}`}>
                                            <p className="font-semibold text-slate-800 dark:text-white mb-1">{notif.title}</p>
                                            <p className="text-slate-600 dark:text-slate-300 mb-2">{notif.message}</p>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                {new Date(notif.time).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-3 focus:outline-none hover:opacity-80 transition-opacity pl-4 border-l border-slate-200 dark:border-slate-700"
                    >
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{user?.name || 'Guest User'}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{role || 'No Role'}</p>
                        </div>
                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm text-sm border-2 border-white dark:border-slate-800">
                            {getInitials(user?.name)}
                        </div>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-50 transition-colors duration-200">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 sm:hidden">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{role}</p>
                            </div>
                            <Link
                                to="/settings"
                                onClick={() => setIsDropdownOpen(false)}
                                className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Account Settings
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;