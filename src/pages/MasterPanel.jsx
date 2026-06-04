import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scissors, DollarSign, Clock, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import MasterHeader from '@/components/master/MasterHeader';

export default function MasterPanel() {
  useEffect(() => {
    document.title = 'Master | Gestor Barber';
    return () => { document.title = 'Gestor Barber'; };
  }, []);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['master-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 300),
  });

  const stats = {
    total:      companies.length,
    ativas:     companies.filter(c => c.status === 'active' && c.status_cobranca === 'ativo').length,
    trial:      companies.filter(c => c.status_cobranca === 'trial').length,
    inadimplentes: companies.filter(c => c.status_cobranca === 'inadimplente' || c.observacoes_internas === 'pending_stripe_payment').length,
    suspensas:  companies.filter(c => c.status === 'blocked').length,
  };

  const mrr = companies
    .filter(c => c.status === 'active' && c.status_cobranca === 'ativo')
    .reduce((acc, c) => {
      const prices = { Essencial: 59, Profissional: 99, Premium: 149 };
      return acc + (prices[c.plan_name] ?? 0);
    }, 0);

  const cards = [
    { icon: Scissors,     label: 'Total de barbearias', value: stats.total,         sub: `${stats.ativas} ativas`,              color: '#1B3A4B' },
    { icon: DollarSign,   label: 'MRR estimado',        value: `R$ ${mrr}`,          sub: `${stats.ativas} assinantes`,          color: '#16a34a' },
    { icon: Clock,        label: 'Em trial',             value: stats.trial,          sub: 'período gratuito',                    color: '#C89B3C' },
    { icon: AlertCircle,  label: 'Inadimplentes',        value: stats.inadimplentes,  sub: 'aguardando pagamento',  highlight: stats.inadimplentes > 0, color: '#dc2626' },
  ];

  const quickLinks = [
    { to: '/master/barbearias', label: 'Gerenciar barbearias', desc: 'Ver lista, criar, editar e suspender', icon: Scissors, color: '#1B3A4B' },
    { to: '/master/financeiro',  label: 'Financeiro',          desc: 'MRR, inadimplentes e conversões',       icon: DollarSign, color: '#16a34a' },
    { to: '/master/conteudo',    label: 'Central de conteúdo', desc: 'Tutoriais, avisos e publicidade',        icon: BookOpen, color: '#7C3AED' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <MasterHeader active="/master" />

      <div className="p-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1B1C1E]">Visão geral</h1>
          <p className="text-sm text-gray-400 mt-1">Resumo do Gestor Barber</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {cards.map(c => (
            <div key={c.label} className={`rounded-2xl border p-5 flex flex-col gap-1 ${c.highlight ? 'bg-red-50 border-red-200' : 'bg-white border-black/8'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}18` }}>
                  <c.icon className="w-3.5 h-3.5" style={{ color: c.color }} />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{c.label}</span>
              </div>
              <div className={`text-3xl font-black ${c.highlight ? 'text-red-600' : 'text-[#1B1C1E]'}`}>{isLoading ? '—' : c.value}</div>
              <div className="text-xs text-gray-400">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Acesso rápido</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickLinks.map(l => (
            <Link key={l.to} to={l.to}
              className="bg-white rounded-2xl border border-black/8 p-5 flex flex-col gap-3 hover:border-black/20 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${l.color}15` }}>
                <l.icon className="w-5 h-5" style={{ color: l.color }} />
              </div>
              <div>
                <div className="font-bold text-sm text-[#1B1C1E] flex items-center gap-1">
                  {l.label}
                  <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
                <div className="text-xs text-gray-400 mt-0.5">{l.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
