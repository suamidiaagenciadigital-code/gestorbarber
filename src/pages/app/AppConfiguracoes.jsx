import AppLayout from '@/components/layout/AppLayout';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/lib/AuthContext';
import { useState, useEffect } from 'react';
import { Save, Globe, Copy, CheckCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DAYS = [
  { key: 'seg', label: 'Segunda' }, { key: 'ter', label: 'Terça' }, { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' }, { key: 'sex', label: 'Sexta' }, { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const defaultHours = Object.fromEntries(DAYS.map(d => [d.key, { open: '09:00', close: '19:00', active: d.key !== 'dom' }]));

export default function AppConfiguracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { adminSession } = useAuth();
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [pwForm, setPwForm] = useState({ nova: '', confirma: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const { company, companyId, isLoading } = useCompany();

  const [form, setForm] = useState({
    name: '', slug: '', phone: '', whatsapp: '', address: '',
    primary_color: '#1B3A4B', business_hours: defaultHours,
    retention_interval_days: 30,
  });

  // Populate form when company data arrives — only once per company load
  useEffect(() => {
    if (company && !ready) {
      setForm({
        name: company.name || company.nome_fantasia || '',
        slug: company.slug || '',
        phone: company.phone || '',
        whatsapp: company.whatsapp || '',
        address: company.address || '',
        primary_color: company.primary_color || '#1B3A4B',
        business_hours: company.business_hours || defaultHours,
        retention_interval_days: company.retention_interval_days || 30,
      });
      setReady(true);
    }
  }, [company, ready]);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Company.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast({ title: 'Configurações salvas!' });
    },
    onError: (e) => toast({ title: 'Erro ao salvar', description: e?.message, variant: 'destructive' }),
  });

  const handleSave = () => {
    if (!companyId) return;
    updateMutation.mutate({ id: companyId, data: form });
  };

  const handleChangePassword = async () => {
    if (!pwForm.nova || pwForm.nova.length < 6) {
      toast({ title: 'A nova senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (pwForm.nova !== pwForm.confirma) {
      toast({ title: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }
    const userId = adminSession?.user?.id;
    if (!userId) {
      toast({ title: 'Sessão inválida — faça login novamente', variant: 'destructive' });
      return;
    }
    setPwLoading(true);
    try {
      await base44.functions.invoke('barbeariaUserActions', {
        action: 'change_password',
        user_id: userId,
        nova_senha: pwForm.nova,
      });
      toast({ title: 'Senha alterada com sucesso!' });
      setPwForm({ nova: '', confirma: '' });
    } catch (e) {
      toast({ title: 'Erro ao alterar senha', description: e?.message, variant: 'destructive' });
    } finally {
      setPwLoading(false);
    }
  };

  const publicLink = `${window.location.origin}/agendar/${form.slug || 'sua-barbearia'}`;

  const copyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setHour = (day, field, val) => {
    setForm(p => ({ ...p, business_hours: { ...p.business_hours, [day]: { ...p.business_hours[day], [field]: val } } }));
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-[#C89B3C]" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-[#1B1C1E]">Configurações</h1>
          <p className="text-gray-500 text-sm mt-1">Configure sua barbearia e link público de agendamento</p>
        </div>

        {/* Public link */}
        {form.slug && (
          <div className="bg-[#1B3A4B]/5 border border-[#1B3A4B]/20 rounded-2xl p-5 mb-6 flex items-center gap-4">
            <Globe className="w-5 h-5 text-[#1B3A4B] flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-semibold text-[#1B3A4B] mb-1">Seu link público de agendamento</div>
              <div className="text-sm font-medium text-gray-700 break-all">{publicLink}</div>
            </div>
            <button onClick={copyLink} className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex-shrink-0 ${copied ? 'bg-green-100 text-green-700' : 'bg-[#1B3A4B] text-white hover:bg-[#1B3A4B]/90'}`}>
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        )}

        <div className="space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-5">Informações básicas</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nome da barbearia', key: 'name', placeholder: 'Ex: Barbearia Studio 47' },
                { label: 'Slug (URL pública)', key: 'slug', placeholder: 'ex: studio47' },
                { label: 'Telefone', key: 'phone', placeholder: '(11) 99999-9999' },
                { label: 'WhatsApp', key: 'whatsapp', placeholder: '11999999999' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                </div>
              ))}
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Endereço</label>
                <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade"
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Cor principal</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-black/10 cursor-pointer" />
                  <input type="text" value={form.primary_color} onChange={e => setForm(p => ({ ...p, primary_color: e.target.value }))}
                    className="flex-1 px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                </div>
              </div>
            </div>
          </div>

          {/* Fidelização */}
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-1">Fidelização & Retorno automático</h2>
            <p className="text-xs text-gray-500 mb-5">Clientes sem visita há mais do que este número de dias serão contatados automaticamente com mensagem de retorno.</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Intervalo de inatividade (dias)</label>
                <input
                  type="number" min={7} max={365}
                  value={form.retention_interval_days}
                  onChange={e => setForm(p => ({ ...p, retention_interval_days: parseInt(e.target.value) || 30 }))}
                  className="w-32 px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20"
                />
              </div>
              <div className="text-sm text-gray-500 mt-4">
                Clientes sem corte há <strong>{form.retention_interval_days}</strong> dias receberão mensagem de retorno (máx. 1x por mês por cliente).
              </div>
            </div>
          </div>

          {/* Business hours */}
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-5">Horários de funcionamento</h2>
            <div className="space-y-3">
              {DAYS.map(({ key, label }) => {
                const h = form.business_hours[key] || { open: '09:00', close: '19:00', active: false };
                return (
                  <div key={key} className="flex items-center gap-4">
                    <label className="flex items-center gap-2 w-32">
                      <input type="checkbox" checked={h.active} onChange={e => setHour(key, 'active', e.target.checked)} />
                      <span className={`text-sm font-medium ${h.active ? 'text-[#1B1C1E]' : 'text-gray-400'}`}>{label}</span>
                    </label>
                    {h.active ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={h.open} onChange={e => setHour(key, 'open', e.target.value)}
                          className="px-3 py-1.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                        <span className="text-gray-400 text-sm">até</span>
                        <input type="time" value={h.close} onChange={e => setHour(key, 'close', e.target.value)}
                          className="px-3 py-1.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Fechado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {/* Password change — only for barbearia owners (adminSession) */}
          {adminSession?.user && (
            <div className="bg-white rounded-2xl border border-black/8 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Lock className="w-4 h-4 text-[#1B3A4B]" />
                <h2 className="font-bold text-[#1B1C1E]">Segurança — Alterar senha</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={pwForm.nova}
                      onChange={e => setPwForm(p => ({ ...p, nova: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2.5 pr-10 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmar nova senha</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={pwForm.confirma}
                    onChange={e => setPwForm(p => ({ ...p, confirma: e.target.value }))}
                    placeholder="Repita a nova senha"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={pwLoading || !pwForm.nova || !pwForm.confirma}
                className="mt-4 flex items-center gap-2 bg-[#1B3A4B] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#1B3A4B]/90 transition-colors disabled:opacity-50">
                {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                {pwLoading ? 'Alterando...' : 'Alterar senha'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button onClick={handleSave} disabled={updateMutation.isPending || !companyId}
            className="flex items-center gap-2 bg-[#1B3A4B] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#1B3A4B]/90 transition-colors disabled:opacity-60">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {updateMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
