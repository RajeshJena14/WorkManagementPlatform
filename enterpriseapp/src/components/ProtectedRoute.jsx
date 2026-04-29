import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ allowedRoles }) => {
    const { isAuthenticated, role } = useSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // If authenticated but unauthorized role, send to their dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // If authorized, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;