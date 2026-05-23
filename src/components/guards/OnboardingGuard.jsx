import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useCompany } from '@/hooks/useCompany';

export default function OnboardingGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { company, isLoading: loadingCompany } = useCompany();

  if (loading || loadingCompany) return null;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (company?.onboarding_completed) return <Navigate to="/app/dashboard" replace />;
  return children;
}
