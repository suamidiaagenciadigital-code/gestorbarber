import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Scissors, Plus, Globe, CheckCircle, XCircle, Clock, X, ExternalLink, Trash2, BookOpen, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  active: { label: 'Ativa', color: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inativa', color: 'bg-gray-100 text-gray-500' },
  blocked: { label: 'Bloqueada', color: 'bg-red-100 text-red-600' },
};

export default function MasterPanel() {
  const { setAdminSession } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', owner_email: '', plan_name: 'Essencial', status: 'active', slug: '', trial_dias: 7 });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const toSlug = (str) =>
    str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '').slice(0, 30);

  const handleNameChange = (value) => {
    setForm(p => ({ ...p, name: value, ...(!slugManuallyEdited && { slug: toSlug(value) }) }));
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    setForm(p => ({ ...p, slug: toSlug(value) }));
  };
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Master | Gestor Barber';
    return () => { document.title = 'Gestor Barber'; };
  }, []);
  const queryClient = useQueryClient();

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['master-companies'],
    queryFn: () => base44.entities.Company.list('-created_date', 200),
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      // Mapeia plan_name para o campo 'plano' esperado pela Edge Function
      const planoMap = { Essencial: 'starter', Profissional: 'pro', Premium: 'premium' };
      const planName = data.plan_name || 'Essencial';
      const trialAte = new Date();
      trialAte.setDate(trialAte.getDate() + (Number(data.trial_dias) || 7));
      const res = await base44.functions.invoke('createBarbearia', {
        name: data.name,
        nome_fantasia: data.name,
        slug: data.slug,
        owner_email: data.owner_email || '',
        owner_nome: '',
        plan_name: planName,
        plano: planoMap[planName] || 'starter',
        ciclo: 'mensal',
        status_cobranca: 'trial',
        trial_ate: trialAte.toISOString(),
        status: 'active',
        limite_usuarios: planName === 'Essencial' ? 1 : planName === 'Profissional' ? 5 : 999,
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
      setForm({ name: '', owner_email: '', plan_name: 'Essencial', status: 'active', slug: '', trial_dias: 7 });
      setSlugManuallyEdited(false);
      setFormError('');
      if (data.senha_gerada) {
        setFormSuccess(`Empresa criada! Senha temporária: ${data.senha_gerada}`);
        setTimeout(() => setFormSuccess(''), 15000);
      }
    },
    onError: (err) => {
      setFormError(err.message || 'Erro ao criar empresa. Tente novamente.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['master-companies'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Company.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['master-companies'] }); setConfirmDeleteId(null); },
  });

  const active = companies.filter(c => c.status === 'active').length;
  const onboarding = companies.filter(c => !c.onboarding_completed).length;

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      {/* Header */}
      <header className="bg-[#111111] text-white px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C', letterSpacing: '-0.5px' }}>GB</span>
          </div>
          <div>
            <div className="font-bold">Gestor Barber — Master</div>
            <div className="text-xs text-white/60">Painel Super Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/master/barbearias" className="text-xs text-white/60 hover:text-white">Barbearias</Link>
          <Link to="/master/financeiro" className="text-xs text-white/60 hover:text-white">Financeiro</Link>
          <Link to="/" className="text-xs text-white/60 hover:text-white">← LP Pública</Link>
          <Link to="/master/conteudo" className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white">
            <BookOpen className="w-3.5 h-3.5" />Conteúdo
          </Link>
          {companies[0]?.slug && (
            <Link to={`/app/dashboard?slug=${companies[0].slug}`} className="text-xs text-white/60 hover:text-white">App →</Link>
          )}
          <button
            onClick={async () => { await base44.auth.logout(); navigate('/'); }}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors ml-2 border-l border-white/10 pl-3">
            <LogOut className="w-3.5 h-3.5" />Sair
          </button>
        </div>
      </header>

      <div className="p-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total de empresas', value: companies.length },
            { label: 'Ativas', value: active },
            { label: 'Em onboarding', value: onboarding },
            { label: 'Bloqueadas', value: companies.filter(c => c.status === 'blocked').length },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-black/8 p-5">
              <div className="text-3xl font-black text-[#1B1C1E]">{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Companies table */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="p-5 border-b border-black/8 flex items-center justify-between">
            <h2 className="font-bold text-[#1B1C1E]">Empresas cadastradas</h2>
            <button onClick={() => setShowForm(true)} className="bg-[#1B3A4B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1B3A4B]/90 transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />Nova empresa
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-black/8">
                {['Empresa', 'Slug / Link', 'Plano', 'Onboarding', 'Status', 'Ações'].map(h => (
                  <th key={h} className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map(c => (
                <tr key={c.id} className="border-b border-black/5 hover:bg-[#F8F7F3] transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-sm text-[#1B1C1E]">{c.name}</div>
                    {c.owner_email && <div className="text-xs text-gray-400">{c.owner_email}</div>}
                  </td>
                  <td className="p-4">
                    {c.slug ? (
                      <a href={`/agendar/${c.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-[#1B3A4B] hover:underline">
                        <Globe className="w-3 h-3" />/agendar/{c.slug}
                      </a>
                    ) : <span className="text-xs text-gray-400">–</span>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-medium px-2 py-1 bg-[#1B3A4B]/10 text-[#1B3A4B] rounded-lg">{c.plan_name || 'Starter'}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      {c.onboarding_completed
                        ? <><CheckCircle className="w-4 h-4 text-green-500" /><span className="text-xs text-green-600">Completo</span></>
                        : <><Clock className="w-4 h-4 text-orange-400" /><span className="text-xs text-orange-600">Etapa {c.onboarding_step || 1}</span></>
                      }
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${statusConfig[c.status || 'active'].color}`}>
                      {statusConfig[c.status || 'active'].label}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {c.slug && (
                        <button onClick={() => navigate(`/app/dashboard?slug=${c.slug}`)}
                          className="text-xs px-2 py-1 rounded-lg font-medium bg-[#1B3A4B]/10 text-[#1B3A4B] hover:bg-[#1B3A4B]/20 transition-colors flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />Ver painel
                        </button>
                      )}
                      <button onClick={() => updateMutation.mutate({ id: c.id, data: { status: c.status === 'active' ? 'blocked' : 'active' } })}
                        className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${c.status === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {c.status === 'active' ? 'Bloquear' : 'Ativar'}
                      </button>
                      {confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteMutation.mutate(c.id)} disabled={deleteMutation.isPending}
                            className="text-xs px-2 py-1 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                            Confirmar
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="text-xs px-2 py-1 rounded-lg font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                            Não
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(c.id)}
                          className="text-xs px-2 py-1 rounded-lg font-medium bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-1">
                          <Trash2 className="w-3 h-3" />Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && !isLoading && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhuma empresa cadastrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg max-w-sm text-center">
          ✅ {formSuccess}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setSlugManuallyEdited(false); setFormError(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[#1B1C1E]">Nova Empresa Cliente</h3>
              <button onClick={() => { setShowForm(false); setSlugManuallyEdited(false); setFormError(''); }}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nome da barbearia *</label>
                <input type="text" value={form.name} onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Slug (link de agendamento) *</label>
                <div className="flex items-center border border-black/10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A4B]/20">
                  <span className="px-2 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-black/10 whitespace-nowrap">/agendar/</span>
                  <input type="text" value={form.slug} onChange={e => handleSlugChange(e.target.value)}
                    className="flex-1 px-2 py-2.5 text-sm focus:outline-none" placeholder="minha-barbearia" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">E-mail do responsável *</label>
                <input type="email" value={form.owner_email} onChange={e => setForm(p => ({ ...p, owner_email: e.target.value }))}
                  placeholder="dono@barbearia.com"
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                <p className="text-xs text-gray-400 mt-1">As credenciais de acesso serão enviadas para este e-mail.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Plano</label>
                <select value={form.plan_name} onChange={e => setForm(p => ({ ...p, plan_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20">
                  <option value="Essencial">Essencial — R$ 59/mês · 1 barbeiro</option>
                  <option value="Profissional">Profissional — R$ 99/mês · até 5 barbeiros</option>
                  <option value="Premium">Premium — R$ 149/mês · ilimitado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Duração do trial</label>
                <select value={form.trial_dias} onChange={e => setForm(p => ({ ...p, trial_dias: Number(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20">
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
                  : 'Criar empresa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}