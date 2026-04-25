import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirige al login pero guarda la ubicación intentada para volver después
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};