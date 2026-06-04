import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Globe, ExternalLink, Mail, Lock, MoreHorizontal, ChevronDown, MessageCircle, Bell, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MasterHeader from '@/components/master/MasterHeader';

const PLAN_LABEL = { Essencial: 'Essencial', Profissional: 'Profissional', Premium: 'Premium' };

function getPaymentBadge(c) {
  if (c.observacoes_internas === 'pending_stripe_payment')
    return { label: '⏳ Aguardando pagamento', cls: 'bg-yellow-100 text-yellow-700' };
  if (c.status === 'blocked')
    return { label: '🔴 Suspenso', cls: 'bg-red-100 text-red-600' };
  if (c.status === 'inactive')
    return { label: '⚫ Inativo', cls: 'bg-gray-100 text-gray-500' };
  if (c.status_cobranca === 'trial')
    return { label: '🔵 Trial', cls: 'bg-blue-100 text-blue-700' };
  if (c.status === 'active' && c.status_cobranca === 'ativo')
    return { label: '🟢 Ativo', cls: 'bg-green-100 text-green-700' };
  return { label: c.status || 'Inativo', cls: 'bg-gray-100 text-gray-400' };
}

const toSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 30);

export default function ListaBarbearias() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal nova barbearia
  const [showForm, setShowForm] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [form, setForm] = useState({ name: '', owner_email: '', plan_name: 'Essencial', slug: '', trial_dias: 7 });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['master-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 300),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-companies'] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const planoMap = { Essencial: 'starter', Profissional: 'pro', Premium: 'premium' };
      const trialAte = new Date();
      trialAte.setDate(trialAte.getDate() + (Number(data.trial_dias) || 7));
      const res = await base44.functions.invoke('createBarbearia', {
        name: data.name,
        nome_fantasia: data.name,
        slug: data.slug,
        owner_email: data.owner_email,
        owner_nome: '',
        plan_name: data.plan_name,
        plano: planoMap[data.plan_name] || 'starter',
        ciclo: 'mensal',
        status_cobranca: 'trial',
        trial_ate: trialAte.toISOString(),
        status: 'active',
        limite_usuarios: data.plan_name === 'Essencial' ? 1 : data.plan_name === 'Profissional' ? 5 : 999,
        gerar_senha_automatica: true,
        enviar_credenciais_email: !!data.owner_email,
        origin: window.location.origin,
      });
      if (!res.data?.success) throw new Error(res.data?.error || 'Erro ao criar empresa');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['master-companies'] });
      setShowForm(false);
      setForm({ name: '', owner_email: '', plan_name: 'Essencial', slug: '', trial_dias: 7 });
      setSlugManuallyEdited(false);
      setFormError('');
      if (data.senha_gerada) {
        setFormSuccess(`Empresa criada! Senha temporária: ${data.senha_gerada}`);
        setTimeout(() => setFormSuccess(''), 15000);
      }
    },
    onError: (err) => setFormError(err.message || 'Erro ao criar empresa.'),
  });

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAction(action, company) {
    setOpenMenu(null);
    if (action === 'suspender') {
      await updateMutation.mutateAsync({ id: company.id, data: { status: 'blocked', status_cobranca: 'suspenso' } });
      showToast('Barbearia suspensa.');
    } else if (action === 'reativar') {
      await updateMutation.mutateAsync({ id: company.id, data: { status: 'active', status_cobranca: 'ativo', observacoes_internas: null } });
      showToast('Barbearia reativada.');
    } else if (action === 'lembrete') {
      const res = await base44.functions.invoke('barbeariaUserActions', { action: 'lembrete_pagamento', company_id: company.id, origin: window.location.origin });
      showToast(res.data?.success ? 'Lembrete de pagamento enviado!' : (res.data?.error || 'Erro'), res.data?.success ? 'success' : 'error');
    } else if (action === 'reenviar') {
      const res = await base44.functions.invoke('barbeariaUserActions', { action: 'reenviar_credenciais', company_id: company.id, origin: window.location.origin });
      showToast(res.data?.success ? 'Credenciais reenviadas!' : (res.data?.error || 'Erro'), res.data?.success ? 'success' : 'error');
    } else if (action === 'forcar_reset') {
      const users = await base44.entities.BarbeariaUser.filter({ barbearia_id: company.id, role: 'owner' });
      if (users[0]) {
        const res = await base44.functions.invoke('barbeariaUserActions', { action: 'forcar_reset_senha', user_id: users[0].id });
        showToast(res.data?.success ? 'Reset de senha forçado.' : (res.data?.error || 'Erro'), res.data?.success ? 'success' : 'error');
      }
    } else if (action === 'editar') {
      navigate(`/master/barbearias/${company.id}/editar`);
    }
  }

  const filtered = companies.filter(c => {
    if (filtroStatus === 'trial') return c.status_cobranca === 'trial';
    if (filtroStatus === 'ativo') return c.status === 'active' && c.status_cobranca === 'ativo';
    if (filtroStatus === 'aguardando') return c.observacoes_internas === 'pending_stripe_payment';
    if (filtroStatus === 'suspenso') return c.status === 'blocked';
    if (filtroPlan && c.plan_name !== filtroPlan) return false;
    return true;
  });

  const stats = {
    total:     companies.length,
    ativas:    companies.filter(c => c.status === 'active' && c.status_cobranca === 'ativo').length,
    trial:     companies.filter(c => c.status_cobranca === 'trial').length,
    aguardando:companies.filter(c => c.observacoes_internas === 'pending_stripe_payment').length,
    suspensas: companies.filter(c => c.status === 'blocked').length,
  };

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter" onClick={e => { if (!e.target.closest('[data-dropdown]')) setOpenMenu(null); }}>
      <MasterHeader active="/master/barbearias" />

      <div className="p-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total',              value: stats.total },
            { label: 'Ativas',             value: stats.ativas },
            { label: 'Em trial',           value: stats.trial },
            { label: 'Aguardando pagto.',  value: stats.aguardando, highlight: stats.aguardando > 0 },
            { label: 'Suspensas',          value: stats.suspensas },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-5 ${s.highlight ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-black/8'}`}>
              <div className={`text-3xl font-black ${s.highlight ? 'text-yellow-700' : 'text-[#1B1C1E]'}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="p-5 border-b border-black/8 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-bold text-[#1B1C1E]">Barbearias</h2>
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
                className="text-xs px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:outline-none">
                <option value="">Todos os status</option>
                <option value="ativo">Ativas</option>
                <option value="trial">Em trial</option>
                <option value="aguardando">Aguardando pagamento</option>
                <option value="suspenso">Suspensas</option>
              </select>
              <select value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)}
                className="text-xs px-2 py-1.5 border border-black/10 rounded-lg bg-white focus:outline-none">
                <option value="">Todos os planos</option>
                <option value="Essencial">Essencial</option>
                <option value="Profissional">Profissional</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <button onClick={() => { setShowForm(true); setFormError(''); }}
              className="text-[#111111] text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2" style={{ background: '#C89B3C' }}>
              <Plus className="w-4 h-4" />Nova barbearia
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/8">
                  {['Barbearia', 'Plano', 'Trial até', 'Próx. vencimento', 'Último acesso', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left p-4 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-black/5 hover:bg-[#F8F7F3] transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-sm text-[#1B1C1E]">{c.nome_fantasia || c.name}</div>
                      <div className="text-xs text-gray-400">{c.owner_email}</div>
                      {c.slug && (
                        <a href={`/agendar/${c.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-[#1B3A4B]/60 hover:text-[#1B3A4B] mt-0.5">
                          <Globe className="w-3 h-3" />{c.slug}
                        </a>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-medium px-2 py-1 bg-[#1B3A4B]/10 text-[#1B3A4B] rounded-lg">
                        {PLAN_LABEL[c.plan_name] || c.plan_name || 'Essencial'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {c.trial_ate
                        ? format(new Date(c.trial_ate), 'dd/MM/yyyy', { locale: ptBR })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {c.proximo_vencimento
                        ? format(new Date(c.proximo_vencimento), 'dd/MM/yyyy', { locale: ptBR })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {c.ultimo_acesso_owner
                        ? format(new Date(c.ultimo_acesso_owner), 'dd/MM/yy HH:mm', { locale: ptBR })
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="p-4">
                      {(() => { const b = getPaymentBadge(c); return (
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${b.cls}`}>{b.label}</span>
                      ); })()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        {c.slug && (
                          <button onClick={() => navigate(`/app/dashboard?slug=${c.slug}`)}
                            className="text-xs px-2 py-1 rounded-lg font-medium bg-[#1B3A4B]/10 text-[#1B3A4B] hover:bg-[#1B3A4B]/20 transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />Painel
                          </button>
                        )}
                        <div className="relative" data-dropdown="true">
                          <button onClick={e => { e.stopPropagation(); setOpenMenu(prev => prev === c.id ? null : c.id); }}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            <MoreHorizontal className="w-3 h-3" /><ChevronDown className="w-3 h-3" />
                          </button>
                          {openMenu === c.id && (
                            <div className="absolute right-0 top-8 bg-white border border-black/10 rounded-xl shadow-xl z-50 w-52 py-1 text-sm" data-dropdown="true">
                              <button onClick={e => { e.stopPropagation(); handleAction('editar', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left">Editar</button>
                              {c.status === 'active'
                                ? <button onClick={e => { e.stopPropagation(); handleAction('suspender', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-red-50 text-red-600 text-left">Suspender</button>
                                : <button onClick={e => { e.stopPropagation(); handleAction('reativar', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-green-50 text-green-700 text-left">Reativar</button>
                              }
                              {c.observacoes_internas === 'pending_stripe_payment' && (<>
                                <div className="border-t border-black/5 my-1" />
                                <button onClick={e => { e.stopPropagation(); handleAction('lembrete', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-yellow-50 text-yellow-700 text-left">
                                  <Bell className="w-3 h-3" />Lembrete de pagamento
                                </button>
                                {c.whatsapp && (
                                  <a href={`https://wa.me/55${c.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Oi! Vi que você ainda não finalizou o pagamento do Gestor Barber. Posso te ajudar? 😊')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    onClick={() => setOpenMenu(null)}
                                    className="flex items-center gap-2 w-full px-4 py-2 hover:bg-green-50 text-green-700 text-left">
                                    <MessageCircle className="w-3 h-3" />WhatsApp
                                  </a>
                                )}
                              </>)}
                              <div className="border-t border-black/5 my-1" />
                              <button onClick={e => { e.stopPropagation(); handleAction('reenviar', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left">
                                <Mail className="w-3 h-3" />Reenviar credenciais
                              </button>
                              <button onClick={e => { e.stopPropagation(); handleAction('forcar_reset', c); }} className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 text-left">
                                <Lock className="w-3 h-3" />Forçar reset de senha
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <tr><td colSpan={7} className="p-10 text-center text-gray-400 text-sm">Nenhuma barbearia encontrada</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold shadow-xl z-50 ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#1B3A4B] text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Sucesso criação */}
      {formSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg max-w-sm text-center">
          ✅ {formSuccess}
        </div>
      )}

      {/* Modal nova barbearia */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setSlugManuallyEdited(false); setFormError(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#1B1C1E]">Nova barbearia</h3>
              <button onClick={() => { setShowForm(false); setSlugManuallyEdited(false); setFormError(''); }}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nome da barbearia *</label>
                <input type="text" value={form.name}
                  onChange={e => {
                    const v = e.target.value;
                    setForm(p => ({ ...p, name: v, ...(!slugManuallyEdited && { slug: toSlug(v) }) }));
                  }}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Slug (link de agendamento) *</label>
                <div className="flex items-center border border-black/10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A4B]/20">
                  <span className="px-2 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-black/10 whitespace-nowrap">/agendar/</span>
                  <input type="text" value={form.slug}
                    onChange={e => { setSlugManuallyEdited(true); setForm(p => ({ ...p, slug: toSlug(e.target.value) })); }}
                    className="flex-1 px-2 py-2.5 text-sm focus:outline-none" placeholder="minha-barbearia" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">E-mail do responsável *</label>
                <input type="email" value={form.owner_email}
                  onChange={e => setForm(p => ({ ...p, owner_email: e.target.value }))}
                  placeholder="dono@barbearia.com"
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                <p className="text-xs text-gray-400 mt-1">As credenciais de acesso serão enviadas para este e-mail.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Plano</label>
                <select value={form.plan_name} onChange={e => setForm(p => ({ ...p, plan_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none bg-white">
                  <option value="Essencial">Essencial — R$ 59/mês · 1 barbeiro</option>
                  <option value="Profissional">Profissional — R$ 99/mês · até 5 barbeiros</option>
                  <option value="Premium">Premium — R$ 149/mês · ilimitado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Duração do trial</label>
                <select value={form.trial_dias} onChange={e => setForm(p => ({ ...p, trial_dias: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none bg-white">
                  <option value={3}>3 dias</option>
                  <option value={7}>7 dias (padrão)</option>
                  <option value={14}>14 dias</option>
                  <option value={30}>30 dias</option>
                </select>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">{formError}</div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setShowForm(false); setSlugManuallyEdited(false); setFormError(''); }}
                className="flex-1 px-4 py-2.5 border border-black/10 rounded-lg text-sm font-medium">Cancelar</button>
              <button
                onClick={() => { setFormError(''); createMutation.mutate(form); }}
                disabled={!form.name || !form.slug || !form.owner_email || createMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-[#1B3A4B] text-white rounded-lg text-sm font-semibold hover:bg-[#1B3A4B]/90 disabled:opacity-50 flex items-center justify-center gap-2">
                {createMutation.isPending
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Criando...</>
                  : 'Criar barbearia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
