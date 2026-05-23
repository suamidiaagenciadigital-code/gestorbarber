import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function SuperAdminRoute({ children }) {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isSuperAdmin) return <Navigate to="/master/login" replace />;
  return children;
}
