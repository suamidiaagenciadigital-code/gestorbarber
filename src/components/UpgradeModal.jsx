import { X, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const PLAN_PERKS = {
  Profissional: [
    'Até 5 barbeiros na equipe',
    'Controle de comissões por profissional',
    'Histórico completo de clientes',
    'Relatórios de atendimentos e faturamento',
    'Painel com indicadores da barbearia',
    'Suporte prioritário',
  ],
  Premium: [
    'Barbeiros ilimitados',
    'Gestão avançada de unidades',
    'Relatórios completos de desempenho',
    'Controle de clientes recorrentes',
    'Recursos para fidelização',
    'Acompanhamento de metas e resultados',
    'Suporte premium',
  ],
};

const PLAN_PRICE = { Profissional: 'R$ 99,00/mês', Premium: 'R$ 149,00/mês' };

export default function UpgradeModal({ onClose, requiredPlan = 'Profissional', featureLabel = 'este recurso' }) {
  const perks = PLAN_PERKS[requiredPlan] ?? [];

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
          <p className="text-xs text-gray-400 mb-4 text-center">Entre em contato para fazer upgrade do seu plano</p>
          <a
            href="https://wa.me/5500000000000?text=Quero+fazer+upgrade+do+meu+plano+GestorBarber"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#1B3A4B] text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1B3A4B]/90 transition-colors"
          >
            Fazer upgrade agora <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
