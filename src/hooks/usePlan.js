import { useCompany } from './useCompany';
import { getPlan, normalizePlanName } from '@/config/plans';

export function usePlan() {
  const { company, isLoading } = useCompany();
  const planName = normalizePlanName(company?.plan_name);
  const plan = getPlan(company?.plan_name);
  return { planName, plan, isLoading };
}
