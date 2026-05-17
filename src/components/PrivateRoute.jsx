import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

export default function PrivateRoute() {
    const token = useSelector((state) => state.auth.auth.token);
    return token ? <Outlet /> : <Navigate to="/user/login" replace />;
}
