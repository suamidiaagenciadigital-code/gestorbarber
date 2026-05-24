import AppLayout from '@/components/layout/AppLayout';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { usePlan } from '@/hooks/usePlan';
import { Zap } from 'lucide-react';
import PlanGate from '@/components/PlanGate';

import ActionCards from '@/components/aigrowth/ActionCards';
import RevenueChart from '@/components/aigrowth/RevenueChart';
import TopServices from '@/components/aigrowth/TopServices';
import VIPCustomers from '@/components/aigrowth/VIPCustomers';

export default function AppAIGrowth() {
  const { company, companyId, isLoading: loadingCompany } = useCompany();
  const { plan } = usePlan();

  // All hooks must be called before any conditional return
  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => base44.entities.Customer.filter({ company_id: companyId }),
    enabled: !!companyId && !!plan.aiGrowth,
  });

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['appointments', companyId],
    queryFn: () => base44.entities.Appointment.filter({ company_id: companyId }),
    enabled: !!companyId && !!plan.aiGrowth,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', companyId],
    queryFn: () => base44.entities.Service.filter({ company_id: companyId }),
    enabled: !!companyId && !!plan.aiGrowth,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', companyId],
    queryFn: () => base44.entities.Professional.filter({ company_id: companyId }),
    enabled: !!companyId && !!plan.aiGrowth,
  });

  // Plan gate after all hooks
  if (!plan.aiGrowth) {
    return <AppLayout><PlanGate feature="AI Growth Engine" requiredPlan="Profissional" /></AppLayout>;
  }

  const isLoading = loadingCompany || loadingCustomers || loadingAppts;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl">

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#111111' }}>
                <Zap className="w-4 h-4" style={{ color: '#C89B3C' }} />
              </div>
              <h1 className="text-2xl font-black text-[#1B1C1E]">AI Growth Engine</h1>
            </div>
            <p className="text-sm text-gray-400 ml-12">
              Insights e ações gerados com dados reais de <strong className="text-[#1B1C1E]">{company?.name || 'sua barbearia'}</strong>
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-4 border-[#E8DED0] border-t-[#C89B3C] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            <ActionCards
              company={company}
              customers={customers}
              appointments={appointments}
              services={services}
              professionals={professionals}
            />
            <div className="grid lg:grid-cols-2 gap-6">
              <RevenueChart appointments={appointments} />
              <TopServices appointments={appointments} />
            </div>
            <VIPCustomers customers={customers} appointments={appointments} />
          </div>
        )}
      </div>
    </AppLayout>
  );
}
