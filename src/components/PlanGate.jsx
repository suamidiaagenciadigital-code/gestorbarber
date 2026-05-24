import { Lock, ArrowRight } from 'lucide-react';

const PLAN_PRICE = { Profissional: 'R$ 99,00/mês', Premium: 'R$ 149,00/mês' };

export default function PlanGate({ feature, requiredPlan = 'Profissional' }) {
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
        <p className="text-gray-400 text-xs mb-6">{PLAN_PRICE[requiredPlan]}</p>
        <a
          href="https://wa.me/5500000000000?text=Quero+fazer+upgrade+do+meu+plano+GestorBarber"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#1B3A4B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1B3A4B]/90 transition-colors"
        >
          Fazer upgrade <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
