import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';

const Field = ({ label, children, full }) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
);
const Input = ({ value, onChange, type = 'text', placeholder }) => (
  <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
);
const Select = ({ value, onChange, options }) => (
  <select value={value ?? ''} onChange={e => onChange(e.target.value)}
    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none bg-white">
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

export default function EditarBarbearia() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['company-edit', id],
    queryFn: async () => {
      const r = await base44.entities.Company.filter({ id });
      return r[0] ?? null;
    },
    enabled: !!id,
  });

  useEffect(() => { if (company) setForm({ ...company }); }, [company]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(id, data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); },
  });

  const set = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  if (isLoading || !form) {
    return (
      <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1B3A4B]/20 border-t-[#1B3A4B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <header className="bg-[#111111] text-white px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C' }}>GB</span>
          </div>
          <div>
            <div className="font-bold">Gestor Barber — Master</div>
            <div className="text-xs text-white/60">Editar barbearia</div>
          </div>
        </div>
        <Link to="/master/barbearias" className="flex items-center gap-2 text-sm text-white/70 hover:text-white">
          <ArrowLeft className="w-4 h-4" />Voltar
        </Link>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-black text-[#1B1C1E] mb-6">{form.nome_fantasia || form.name}</h1>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 mb-6 text-sm">
            ✓ Alterações salvas.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-black/8 p-6 mb-6">
          <h2 className="font-bold text-[#1B1C1E] text-base mb-5 pb-3 border-b border-black/8">Dados da barbearia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nome fantasia"><Input value={form.nome_fantasia} onChange={set('nome_fantasia')} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={set('slug')} /></Field>
            <Field label="E-mail de contato"><Input value={form.email_contato} onChange={set('email_contato')} type="email" /></Field>
            <Field label="WhatsApp"><Input value={form.whatsapp} onChange={set('whatsapp')} /></Field>
            <Field label="Plano">
              <Select value={form.plano} onChange={set('plano')} options={[
                { value: 'starter', label: 'Starter' }, { value: 'pro', label: 'Pro' }, { value: 'premium', label: 'Premium' },
              ]} />
            </Field>
            <Field label="Status de cobrança">
              <Select value={form.status_cobranca} onChange={set('status_cobranca')} options={[
                { value: 'trial', label: 'Trial' }, { value: 'ativo', label: 'Ativo' },
                { value: 'inadimplente', label: 'Inadimplente' }, { value: 'suspenso', label: 'Suspenso' },
                { value: 'cancelado', label: 'Cancelado' },
              ]} />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={set('status')} options={[
                { value: 'active', label: 'Ativa' }, { value: 'inactive', label: 'Inativa' }, { value: 'blocked', label: 'Bloqueada' },
              ]} />
            </Field>
            <Field label="Trial até"><Input value={form.trial_ate} onChange={set('trial_ate')} type="date" /></Field>
            <Field label="Próximo vencimento"><Input value={form.proximo_vencimento} onChange={set('proximo_vencimento')} type="date" /></Field>
            <Field label="Limite de usuários"><Input value={form.limite_usuarios} onChange={set('limite_usuarios')} type="number" /></Field>
            <Field label="Observações internas" full>
              <textarea value={form.observacoes_internas ?? ''} onChange={e => set('observacoes_internas')(e.target.value)}
                rows={3} className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none resize-none" />
            </Field>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/master/barbearias" className="px-6 py-2.5 border border-black/10 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</Link>
          <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-8 py-2.5 text-[#111111] rounded-lg text-sm font-semibold disabled:opacity-60"
            style={{ background: '#C89B3C' }}>
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
