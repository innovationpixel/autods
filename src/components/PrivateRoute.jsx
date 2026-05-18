import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { getStoredToken } from '../services/AuthService';

export default function PrivateRoute() {
    const token = useSelector((state) => state.auth.auth.token) || getStoredToken();
    return token ? <Outlet /> : <Navigate to="/user/login" replace />;
}
