import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AdminRoute({ children }) {
  const { adminSession, isSuperAdmin, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#C89B3C] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  // Allow barbearia users (localStorage session) OR super admins
  if (!adminSession && !isSuperAdmin) return <Navigate to="/admin/login" replace />;
  return children;
}
