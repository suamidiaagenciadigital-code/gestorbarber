import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Users, Clock, AlertCircle, DollarSign } from 'lucide-react';

const PLAN_PRICE = { starter: 59, pro: 99, premium: 149 };
const PLAN_LABEL = { starter: 'Essencial', pro: 'Profissional', premium: 'Premium' };
const PLAN_COLOR = { starter: '#1B3A4B', pro: '#C89B3C', premium: '#6B6258' };

function fmt(n) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });
}

function StatCard({ icon: Icon, label, value, sub, highlight, color = '#1B3A4B' }) {
  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${highlight ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-black/8'}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-3xl font-black ${highlight ? 'text-yellow-700' : 'text-[#1B1C1E]'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function PlanBar({ label, count, total, mrr, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs font-semibold text-gray-600 shrink-0">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-gray-500 w-6 text-right">{count}</div>
      <div className="text-xs font-semibold text-gray-700 w-20 text-right">{fmt(mrr)}</div>
    </div>
  );
}

export default function FinanceiroMaster() {
  const [filtroPlano, setFiltroPlano] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['master-financeiro-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 300),
  });

  const paying = companies.filter(c =>
    c.status === 'active' &&
    c.status_cobranca === 'ativo' &&
    c.observacoes_internas !== 'pending_stripe_payment'
  );
  const trials = companies.filter(c => c.status_cobranca === 'trial');
  const pending = companies.filter(c => c.observacoes_internas === 'pending_stripe_payment');
  const suspended = companies.filter(c => c.status === 'blocked');

  const mrr = paying.reduce((acc, c) => acc + (PLAN_PRICE[c.plano] ?? 0), 0);
  const potentialMrr = trials.reduce((acc, c) => acc + (PLAN_PRICE[c.plano] ?? 59), 0);

  const conversionRate = (paying.length + trials.length) > 0
    ? Math.round((paying.length / (paying.length + trials.length)) * 100)
    : 0;

  const planStats = ['starter', 'pro', 'premium'].map(p => ({
    key: p,
    label: PLAN_LABEL[p],
    color: PLAN_COLOR[p],
    count: paying.filter(c => c.plano === p).length,
    mrr: paying.filter(c => c.plano === p).reduce((a, c) => a + PLAN_PRICE[p], 0),
  }));

  const vencendoEm7 = companies.filter(c => {
    if (!c.proximo_vencimento) return false;
    const diff = (new Date(c.proximo_vencimento) - new Date()) / 86400000;
    return diff >= 0 && diff <= 7 && c.status === 'active';
  });

  const listFiltered = companies.filter(c => {
    if (filtroPlano && c.plano !== filtroPlano) return false;
    if (filtroStatus === 'ativo') return c.status === 'active' && c.status_cobranca === 'ativo' && c.observacoes_internas !== 'pending_stripe_payment';
    if (filtroStatus === 'trial') return c.status_cobranca === 'trial';
    if (filtroStatus === 'aguardando') return c.observacoes_internas === 'pending_stripe_payment';
    if (filtroStatus === 'suspenso') return c.status === 'blocked';
    return true;
  });

  function statusBadge(c) {
    if (c.observacoes_internas === 'pending_stripe_payment') return { label: '⏳ Aguardando', cls: 'bg-yellow-100 text-yellow-700' };
    if (c.status === 'blocked') return { label: '🔴 Suspenso', cls: 'bg-red-100 text-red-600' };
    if (c.status_cobranca === 'trial') return { label: '🔵 Trial', cls: 'bg-blue-100 text-blue-700' };
    if (c.status === 'active' && c.status_cobranca === 'ativo') return { label: '🟢 Ativo', cls: 'bg-green-100 text-green-700' };
    return { label: '⚫ Inativo', cls: 'bg-gray-100 text-gray-500' };
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <header className="bg-[#111111] text-white px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C', letterSpacing: '-0.5px' }}>GB</span>
          </div>
          <div>
            <div className="font-bold">Gestor Barber — Financeiro</div>
            <div className="text-xs text-white/60">Receita e assinaturas</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/master/barbearias" className="text-xs text-white/60 hover:text-white">Barbearias</Link>
          <Link to="/master" className="text-xs text-white/60 hover:text-white">← Master</Link>
        </div>
      </header>

      <div className="p-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard icon={DollarSign} label="MRR" value={fmt(mrr)} sub="receita recorrente mensal" color="#1B3A4B" />
          <StatCard icon={Users} label="Pagantes" value={paying.length} sub={`${fmt(mrr)} / mês`} color="#16a34a" />
          <StatCard icon={Clock} label="Em trial" value={trials.length} sub={`até ${fmt(potentialMrr)} potencial`} color="#C89B3C" />
          <StatCard icon={AlertCircle} label="Aguardando" value={pending.length} sub="pagamento pendente" highlight={pending.length > 0} color="#d97706" />
          <StatCard icon={TrendingUp} label="Conversão" value={`${conversionRate}%`} sub="trials → pagantes" color="#1B3A4B" />
        </div>

        {/* MRR por plano + alerta vencimento */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-1">Receita por plano</h2>
            <p className="text-xs text-gray-400 mb-5">Apenas assinantes ativos pagantes</p>
            <div className="space-y-4">
              {planStats.map(p => (
                <PlanBar key={p.key} label={p.label} count={p.count} total={paying.length} mrr={p.mrr} color={p.color} />
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-black/8 flex items-center justify-between">
              <span className="text-xs text-gray-400">MRR total</span>
              <span className="text-lg font-black text-[#1B1C1E]">{fmt(mrr)}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-1">Vencimentos próximos</h2>
            <p className="text-xs text-gray-400 mb-4">Renovações nos próximos 7 dias</p>
            {vencendoEm7.length === 0 ? (
              <div className="text-sm text-gray-400 py-6 text-center">Nenhum vencimento nos próximos 7 dias</div>
            ) : (
              <div className="space-y-2">
                {vencendoEm7.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-black/5 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-[#1B1C1E]">{c.nome_fantasia || c.name}</div>
                      <div className="text-xs text-gray-400">{PLAN_LABEL[c.plano] || c.plano}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#C89B3C]">
                        {format(new Date(c.proximo_vencimento), 'dd/MM', { locale: ptBR })}
                      </div>
                      <div className="text-xs text-gray-400">{fmt(PLAN_PRICE[c.plano] ?? 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lista de assinaturas */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="p-5 border-b border-black/8 flex flex-wrap items-center gap-3 justify-between">
            <h2 className="font-bold text-[#1B1C1E]">Assinaturas</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                className="text-xs px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:outline-none">
                <option value="">Todos status</option>
                <option value="ativo">Ativos</option>
                <option value="trial">Trial</option>
                <option value="aguardando">Aguardando pagamento</option>
                <option value="suspenso">Suspensos</option>
              </select>
              <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}
                className="text-xs px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:outline-none">
                <option value="">Todos planos</option>
                <option value="starter">Essencial</option>
                <option value="pro">Profissional</option>
                <option value="premium">Premium</option>
              </select>
              <span className="text-xs text-gray-400">{listFiltered.length} empresa{listFiltered.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/8">
                  {['Barbearia', 'Plano', 'Valor/mês', 'Status', 'Cadastro', 'Próx. vencimento', 'Último acesso'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listFiltered.map(c => {
                  const badge = statusBadge(c);
                  return (
                    <tr key={c.id} className="border-b border-black/5 hover:bg-[#F8F7F3] transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-sm text-[#1B1C1E]">{c.nome_fantasia || c.name}</div>
                        <div className="text-xs text-gray-400">{c.owner_email}</div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg"
                          style={{ background: `${PLAN_COLOR[c.plano] || '#6B6258'}18`, color: PLAN_COLOR[c.plano] || '#6B6258' }}>
                          {PLAN_LABEL[c.plano] || 'Essencial'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold text-[#1B1C1E]">
                        {c.status_cobranca === 'ativo' ? fmt(PLAN_PRICE[c.plano] ?? 0) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {c.created_date
                          ? format(new Date(c.created_date), 'dd/MM/yyyy', { locale: ptBR })
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {c.proximo_vencimento
                          ? format(new Date(c.proximo_vencimento), 'dd/MM/yyyy', { locale: ptBR })
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {c.ultimo_acesso_owner
                          ? format(new Date(c.ultimo_acesso_owner), 'dd/MM/yy HH:mm', { locale: ptBR })
                          : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {listFiltered.length === 0 && !isLoading && (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-400 text-sm">Nenhuma empresa encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
