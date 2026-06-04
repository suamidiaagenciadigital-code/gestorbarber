import { useState } from 'react';
import { Lock, Zap, Loader2 } from 'lucide-react';
import { useCompany } from '@/hooks/useCompany';
import { base44 } from '@/api/base44Client';

const PLAN_CONFIG = {
  Profissional: {
    price: 'R$ 99,00',
    paymentUrl: 'https://buy.stripe.com/aFa7sNehkajjgVi24TgIo00',
  },
  Premium: {
    price: 'R$ 149,00',
    paymentUrl: 'https://buy.stripe.com/8x28wRfloezzdJ69xlgIo01',
  },
};

export default function PlanGate({ feature, requiredPlan = 'Profissional' }) {
  const config = PLAN_CONFIG[requiredPlan] ?? PLAN_CONFIG.Profissional;
  const { company, companyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setError('');

    // Empresa com assinatura Stripe ativa → abre Customer Portal (upgrade correto)
    if (company?.stripe_customer_id) {
      setLoading(true);
      try {
        const { data } = await base44.functions.invoke('createPortalSession', {
          company_id: companyId,
          return_url: window.location.href,
        });
        if (data?.url) {
          window.location.href = data.url;
        } else {
          throw new Error('URL do portal não retornada');
        }
      } catch (e) {
        console.warn('[PlanGate] Portal falhou, abrindo Payment Link:', e.message);
        // Fallback: abre o Payment Link em nova aba
        window.open(config.paymentUrl, '_blank');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Empresa sem stripe_customer_id (criada pelo master ou ainda não pagou)
    // → abre o Payment Link direto
    window.open(config.paymentUrl, '_blank');
  };

  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-[#1B3A4B]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-7 h-7 text-[#1B3A4B]/40" />
        </div>
        <h2 className="text-xl font-black text-[#1B1C1E] mb-2">{feature}</h2>
        <p className="text-gray-500 text-sm mb-1">
          Este recurso está disponível a partir do plano
        </p>
        <p className="font-bold text-[#C89B3C] mb-1">{requiredPlan}</p>
        <p className="text-gray-400 text-xs mb-6">{config.price}/mês · cancele quando quiser</p>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-[#C89B3C] text-[#111111] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#C89B3C]/90 transition-colors shadow-sm disabled:opacity-60"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</>
            : <><Zap className="w-4 h-4" />Fazer upgrade para {requiredPlan}</>
          }
        </button>

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <p className="text-xs text-gray-400 mt-3">Pagamento seguro via Stripe</p>
      </div>
    </div>
  );
}
