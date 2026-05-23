import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AdminRoute({ children }) {
  const { adminSession, isSuperAdmin, loading } = useAuth();
  if (loading) return null;
  // Allow barbearia users (localStorage session) OR super admins
  if (!adminSession && !isSuperAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
