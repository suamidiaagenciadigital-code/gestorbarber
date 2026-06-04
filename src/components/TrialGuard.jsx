import { useState } from 'react';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Clock, Loader2, Zap } from 'lucide-react';

const PLANS = [
  {
    name: 'Essencial',
    monthly: 59,
    annual: 47.20,
    annualTotal: 566.40,
    desc: 'Para barbeiros autônomos que trabalham sozinhos.',
  },
  {
    name: 'Profissional',
    monthly: 99,
    annual: 79.20,
    annualTotal: 950.40,
    desc: 'Para barbearias em crescimento com equipe.',
    highlight: true,
  },
  {
    name: 'Premium',
    monthly: 149,
    annual: 119.20,
    annualTotal: 1430.40,
    desc: 'Para barbearias premium que querem o máximo.',
  },
];

const fmt = (n) => n.toFixed(2).replace('.', ',');

/** Faixa amarela no topo — exibida enquanto o trial está ativo */
export function TrialBanner() {
  const { company } = useCompany();
  const { adminSession, isSuperAdmin } = useAuth();

  if (isSuperAdmin || !adminSession?.user) return null;
  if (company?.status_cobranca !== 'trial' || !company?.trial_ate) return null;

  const now      = new Date();
  const trialEnd = new Date(company.trial_ate);
  const diffMs   = trialEnd - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return null; // TrialExpiredGate cuida deste caso

  const urgent = diffDays <= 2;

  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2 text-sm ${urgent ? 'bg-red-500' : 'bg-amber-500'} text-white`}>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          <strong>Período de teste:</strong>{' '}
          {diffDays === 1 ? 'último dia!' : `${diffDays} dias restantes`}
          {urgent && ' — assine agora para não perder o acesso.'}
        </span>
      </div>
      <a
        href="/app/configuracoes"
        className="bg-white font-bold text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:bg-white/90"
        style={{ color: urgent ? '#DC2626' : '#D97706' }}>
        Assinar agora
      </a>
    </div>
  );
}

/** Tela de bloqueio — substitui o app inteiro quando o trial expira */
export function TrialExpiredGate({ children }) {
  const { company, companyId } = useCompany();
  const { adminSession, isSuperAdmin } = useAuth();
  const [billing, setBilling] = useState('monthly');
  const [loadingPlan, setLoadingPlan] = useState('');
  const [error, setError] = useState('');

  // Super admin e visitantes sempre passam
  if (isSuperAdmin || !adminSession?.user) return children;
  if (!company) return children; // ainda carregando

  const trialExpired =
    company.status_cobranca === 'trial' &&
    company.trial_ate &&
    new Date(company.trial_ate) < new Date();

  // Empresa ativa (pagou) → passa normalmente
  if (!trialExpired) return children;

  const handleSelectPlan = async (planName) => {
    setLoadingPlan(planName);
    setError('');
    try {
      const origin = window.location.origin;
      const { data } = await base44.functions.invoke('createCheckoutSession', {
        company_id: companyId,
        plan_name: planName,
        billing_period: billing,
        owner_email: company.owner_email || '',
        success_url: `${origin}/app/dashboard?trial_converted=1`,
        cancel_url:  `${origin}/app/dashboard`,
      });
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('URL de checkout não retornada.');
      }
    } catch (e) {
      setError('Erro ao iniciar pagamento. Tente novamente ou entre em contato com o suporte.');
      console.error('[TrialExpiredGate]', e);
    } finally {
      setLoadingPlan('');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex flex-col items-center justify-center p-6 font-inter">
      <div className="max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-black text-[#1B1C1E] mb-2">
            Seu período de teste encerrou
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Esperamos que tenha gostado! Escolha um plano para continuar usando o{' '}
            <strong>Gestor Barber</strong> e não perder seus dados.
          </p>
        </div>

        {/* Toggle mensal / anual */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-1 bg-white border border-[#E8DED0] rounded-xl p-1">
            <button
              onClick={() => setBilling('monthly')}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
              style={billing === 'monthly' ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
              style={billing === 'annual' ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
              Anual
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: '#C89B3C', color: '#111111' }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Cards de plano */}
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {PLANS.map(p => {
            const price = billing === 'annual' ? p.annualTotal : p.monthly;
            const isLoading = loadingPlan === p.name;
            return (
              <div
                key={p.name}
                className={`bg-white rounded-2xl border-2 p-5 flex flex-col ${p.highlight ? 'border-[#C89B3C]' : 'border-[#E8DED0]'}`}>
                {p.highlight && (
                  <span className="self-start text-xs font-bold bg-[#C89B3C] text-white px-2 py-0.5 rounded-full mb-3">
                    Mais popular
                  </span>
                )}
                <div className="font-black text-[#1B1C1E] text-base mb-0.5">{p.name}</div>
                <div className="text-xs text-gray-400 mb-3">{p.desc}</div>
                <div className="mb-1">
                  <span className="text-2xl font-black text-[#1B1C1E]">R$ {fmt(price)}</span>
                  <span className="text-xs text-gray-400">/{billing === 'annual' ? 'ano' : 'mês'}</span>
                </div>
                {billing === 'annual' && (
                  <p className="text-xs text-green-600 mb-3 font-medium">
                    R$ {fmt(p.annual)}/mês · economize R$ {fmt((p.monthly - p.annual) * 12)}
                  </p>
                )}
                <button
                  onClick={() => handleSelectPlan(p.name)}
                  disabled={!!loadingPlan}
                  className="mt-auto w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={p.highlight
                    ? { background: '#C89B3C', color: '#111111' }
                    : { background: '#111111', color: '#F7F3EC' }}>
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Aguarde...</>
                    : <><Zap className="w-4 h-4" />Assinar {p.name}</>}
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <p className="text-center text-xs text-red-500 mb-3">{error}</p>
        )}

        <p className="text-center text-xs text-gray-400">
          Pagamento 100% seguro via Stripe · Cancele quando quiser ·{' '}
          <a href="https://wa.me/5562998801004?text=Preciso+de+ajuda+com+meu+trial+do+GestorBarber"
            target="_blank" rel="noopener noreferrer"
            className="underline hover:text-gray-600">
            Falar com o suporte
          </a>
        </p>

      </div>
    </div>
  );
}
