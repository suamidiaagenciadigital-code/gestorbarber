import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';

export function useCompany() {
  const { adminSession, isSuperAdmin } = useAuth();

  // Super admins can impersonate a barbearia via ?slug=xxx
  const slugParam = isSuperAdmin
    ? new URLSearchParams(window.location.search).get('slug')
    : null;

  const companyId = adminSession?.company?.id ?? null;

  const { data: company = null, isLoading } = useQuery({
    queryKey: ['company', companyId, slugParam],
    queryFn: async () => {
      if (slugParam) {
        const results = await base44.entities.Company.filter({ slug: slugParam });
        return results[0] ?? null;
      }
      if (companyId) {
        const results = await base44.entities.Company.filter({ id: companyId });
        return results[0] ?? null;
      }
      return null;
    },
    enabled: !!(companyId || slugParam),
    staleTime: 60_000,
  });

  // Return the resolved company id (from fetched company or from session)
  const resolvedCompanyId = company?.id ?? companyId;

  return { company, companyId: resolvedCompanyId, isLoading };
}
