import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login'
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import Projects from './pages/Projects';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';

// Placeholder Pages for the rest of the application (we will build these out next)
const Unauthorized = () => <div className="p-4 text-xl text-red-500 flex h-screen items-center justify-center">Access Denied</div>;

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Routes wrapped in the UI Layout (Require Authentication) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/board" element={<KanbanBoard />} />
            <Route path="/settings" element={<Settings />} />

            {/* Admin Only Route */}
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback Route - Redirects unknown URLs to Dashboard (which then bounces unauthenticated users to Login) */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} />
    </Router>
  );
}

export default App;