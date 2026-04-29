import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { LayoutDashboard, KanbanSquare, Users, FolderKanban } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { role } = useSelector((state) => state.auth);

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-slate-800 dark:border-slate-900 ${isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
        >
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <h1 className="text-xl font-bold tracking-wider text-white">
                    WORK<span className="text-blue-500">SYNC</span>
                </h1>
                {/* Mobile Close Button */}
                <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                <NavLink
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/projects"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                >
                    <FolderKanban size={20} />
                    Project Center
                </NavLink>

                <NavLink
                    to="/board"
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                >
                    <KanbanSquare size={20} />
                    Project Board
                </NavLink>

                {role === 'Admin' && (
                    <NavLink
                        to="/users"
                        onClick={() => setIsOpen(false)}
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-md transition-colors font-medium ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'}`}
                    >
                        <Users size={20} />
                        User Management
                    </NavLink>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;