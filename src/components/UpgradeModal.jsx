import { X, Lock, ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCompany } from '@/hooks/useCompany';

const PLAN_PERKS = {
  Profissional: [
    'Até 3 membros na equipe',
    'Até 5 barbeiros cadastrados',
    'Controle de comissões por profissional',
    'Histórico completo de clientes',
    'Relatórios de atendimentos e faturamento',
    'AI Growth Engine com insights reais',
    'Suporte prioritário',
  ],
  Premium: [
    'Membros de equipe ilimitados',
    'Barbeiros ilimitados com agenda própria',
    'Gestão avançada de múltiplas unidades',
    'Relatórios completos de desempenho',
    'Controle de clientes recorrentes',
    'Recursos avançados de fidelização',
    'Suporte premium',
  ],
};

const PLAN_PRICE = { Profissional: 'R$ 99,00/mês', Premium: 'R$ 149,00/mês' };
const PRICE_IDS = {
  Profissional: 'price_1TafFOPURVRGZqbhsswycG79',
  Premium: 'price_1TafGoPURVRGZqbh2VPtKKEH',
};

export default function UpgradeModal({ onClose, requiredPlan = 'Profissional', featureLabel = 'este recurso' }) {
  const { companyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const perks = PLAN_PERKS[requiredPlan] ?? [];

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');
    try {
      const origin = window.location.origin;
      const { data, error: fnErr } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          company_id: companyId,
          plan_name: requiredPlan,
          success_url: `${origin}/app/dashboard?upgraded=true`,
          cancel_url: window.location.href,
        },
      });

      if (fnErr || !data?.checkout_url) {
        let msg = 'Erro ao iniciar pagamento. Tente novamente.';
        try {
          const b = await fnErr?.context?.json?.();
          if (b?.error) msg = b.error;
        } catch {}
        setError(msg);
        setLoading(false);
        return;
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      setError(e.message || 'Erro inesperado.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-[#1B1C1E] px-6 py-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C89B3C]/20 rounded-xl flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#C89B3C]" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Recurso bloqueado</p>
              <p className="text-white/60 text-xs mt-0.5">{featureLabel} requer o plano {requiredPlan}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-[#1B1C1E]">Plano {requiredPlan}</p>
            <span className="text-sm font-bold text-[#C89B3C]">{PLAN_PRICE[requiredPlan]}</span>
          </div>
          <ul className="space-y-2 mb-5">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-[#C89B3C] shrink-0" />
                {p}
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg mb-3">{error}</p>
          )}

          <button
            onClick={handleUpgrade}
            disabled={loading || !companyId}
            className="w-full bg-[#C89B3C] text-[#111111] rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#B8892F] transition-colors disabled:opacity-60"
          >
            {loading ? 'Redirecionando...' : 'Fazer upgrade agora'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">Pagamento seguro via Stripe</p>
        </div>
      </div>
    </div>
  );
}
