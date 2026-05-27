import { Lock, ArrowRight, Zap } from 'lucide-react';

const PLAN_CONFIG = {
  Profissional: {
    price: 'R$ 99,00/mês',
    paymentUrl: 'https://buy.stripe.com/aFa7sNehkajjgVi24TgIo00',
  },
  Premium: {
    price: 'R$ 149,00/mês',
    paymentUrl: 'https://buy.stripe.com/8x28wRfloezzdJ69xlgIo01',
  },
};

export default function PlanGate({ feature, requiredPlan = 'Profissional' }) {
  const config = PLAN_CONFIG[requiredPlan] ?? PLAN_CONFIG.Profissional;

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
        <a
          href={config.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#C89B3C] text-[#111111] px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#C89B3C]/90 transition-colors shadow-sm"
        >
          <Zap className="w-4 h-4" />
          Assinar plano {requiredPlan}
        </a>
        <p className="text-xs text-gray-400 mt-3">Pagamento seguro via Stripe</p>
      </div>
    </div>
  );
}
