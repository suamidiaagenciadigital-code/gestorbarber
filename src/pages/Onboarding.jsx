import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getPlan } from '@/config/plans';
import { Check, ArrowRight, ArrowLeft, Copy, ExternalLink } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Dados da barbearia', sub: 'Complete as informações do seu negócio' },
  { id: 2, title: 'Serviços', sub: 'Configure seus primeiros serviços' },
  { id: 3, title: 'Profissionais', sub: 'Adicione os barbeiros' },
  { id: 4, title: 'Tudo pronto!', sub: 'Seu painel está ativo' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { adminSession } = useAuth();
  const companyId = adminSession?.company?.id;
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }).then((r) => r[0] ?? null),
    enabled: !!companyId,
  });

  const plan = getPlan(company?.plan_name);

  const [details, setDetails] = useState({ phone: '', whatsapp: '', address: '', primary_color: '#1B3A4B' });
  const [services, setServices] = useState([{ name: 'Corte Clássico', duration_minutes: 30, price: 45 }]);
  const [professionals, setProfessionals] = useState([{ name: '', specialty: '' }]);

  const updateCompanyMutation = useMutation({
    mutationFn: (data) => base44.entities.Company.update(companyId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', companyId] }),
  });

  const createServiceMutation = useMutation({
    mutationFn: (data) => base44.entities.Service.create(data),
  });

  const createProMutation = useMutation({
    mutationFn: (data) => base44.entities.Professional.create(data),
  });

  const handleNext = async () => {
    if (step === 1) {
      await updateCompanyMutation.mutateAsync({ ...details, onboarding_step: 2 });
    }
    if (step === 2) {
      for (const s of services.filter((s) => s.name)) {
        await createServiceMutation.mutateAsync({ ...s, company_id: companyId, active: true });
      }
      await updateCompanyMutation.mutateAsync({ onboarding_step: 3 });
    }
    if (step === 3) {
      const activePros = professionals.filter((p) => p.name).slice(0, plan.maxBarbers);
      for (const p of activePros) {
        await createProMutation.mutateAsync({ ...p, company_id: companyId, active: true });
      }
      await updateCompanyMutation.mutateAsync({ onboarding_completed: true, onboarding_step: 4 });
    }
    if (step === 4) {
      navigate('/app/dashboard');
      return;
    }
    setStep((s) => s + 1);
  };

  const bookingLink = company?.slug ? `${window.location.origin}/agendar/${company.slug}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(bookingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSaving =
    updateCompanyMutation.isPending ||
    createServiceMutation.isPending ||
    createProMutation.isPending;

  return (
    <div className="min-h-screen bg-[#F8F7F3] flex font-inter">
      {/* Sidebar */}
      <div className="w-64 min-h-screen p-8 flex flex-col hidden md:flex" style={{ background: '#111111' }}>
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C' }}>GB</span>
          </div>
          <span className="font-bold text-white">Gestor Barber</span>
        </div>
        <div className="space-y-1.5">
          {STEPS.map((s) => (
            <div key={s.id} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${s.id === step ? 'bg-white/15' : ''}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold transition-all
                ${s.id < step ? 'bg-[#C89B3C] text-white' : s.id === step ? 'bg-white text-[#1B3A4B]' : 'bg-white/15 text-white/40'}`}>
                {s.id < step ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <div>
                <div className={`text-sm font-semibold ${s.id <= step ? 'text-white' : 'text-white/40'}`}>{s.title}</div>
                <div className={`text-xs mt-0.5 ${s.id === step ? 'text-white/60' : 'text-white/25'}`}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-white/10">
          <p className="text-xs text-white/40">Plano ativo</p>
          <p className="text-sm font-bold text-[#C89B3C] mt-0.5">{plan.label}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 md:p-12 flex flex-col">
        <div className="max-w-lg flex-1">
          <div className="mb-8">
            <div className="text-xs font-semibold text-[#1B3A4B] uppercase tracking-widest mb-2">
              Etapa {step} de {STEPS.length}
            </div>
            <h1 className="text-3xl font-black text-[#1B1C1E]">{STEPS[step - 1].title}</h1>
            <p className="text-gray-500 mt-1">{STEPS[step - 1].sub}</p>
          </div>

          {/* Step 1 — Dados adicionais */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-[#1B3A4B]/5 border border-[#1B3A4B]/15 rounded-xl px-4 py-3 text-sm text-[#1B3A4B]">
                Barbearia: <strong>{company?.name}</strong> · Link: <strong>/agendar/{company?.slug}</strong>
              </div>
              {[
                { label: 'Telefone', key: 'phone', placeholder: '(11) 99999-9999' },
                { label: 'WhatsApp', key: 'whatsapp', placeholder: '11999999999' },
                { label: 'Endereço', key: 'address', placeholder: 'Rua, número, bairro, cidade' },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">{f.label}</label>
                  <input type="text" value={details[f.key]} onChange={(e) => setDetails((p) => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20 bg-white" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Cor principal</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={details.primary_color}
                    onChange={(e) => setDetails((p) => ({ ...p, primary_color: e.target.value }))}
                    className="w-12 h-12 rounded-xl border border-black/10 cursor-pointer" />
                  <div>
                    <div className="text-sm font-semibold text-[#1B1C1E]">{details.primary_color}</div>
                    <div className="text-xs text-gray-400">Cor dos botões na página de agendamento</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Serviços */}
          {step === 2 && (
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-black/10 p-4">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Nome</label>
                      <input type="text" value={s.name}
                        onChange={(e) => setServices((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                        className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Preço (R$)</label>
                      <input type="number" value={s.price}
                        onChange={(e) => setServices((arr) => arr.map((x, j) => j === i ? { ...x, price: +e.target.value } : x))}
                        className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Duração (min)</label>
                    <input type="number" value={s.duration_minutes}
                      onChange={(e) => setServices((arr) => arr.map((x, j) => j === i ? { ...x, duration_minutes: +e.target.value } : x))}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                </div>
              ))}
              <button onClick={() => setServices((p) => [...p, { name: '', duration_minutes: 30, price: 0 }])}
                className="w-full py-2.5 border-2 border-dashed border-black/15 rounded-xl text-sm text-gray-400 hover:border-[#1B3A4B] hover:text-[#1B3A4B] transition-colors">
                + Adicionar serviço
              </button>
            </div>
          )}

          {/* Step 3 — Profissionais */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 bg-black/5 rounded-lg px-3 py-2">
                Seu plano <strong>{plan.label}</strong> permite até{' '}
                <strong>{plan.maxBarbers === Infinity ? 'ilimitados' : plan.maxBarbers}</strong> profissional{plan.maxBarbers === 1 ? '' : 'is'}.
              </p>
              {professionals.slice(0, plan.maxBarbers === Infinity ? professionals.length : plan.maxBarbers).map((p, i) => (
                <div key={i} className="bg-white rounded-xl border border-black/10 p-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Nome</label>
                    <input type="text" value={p.name}
                      onChange={(e) => setProfessionals((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                      className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Especialidade</label>
                    <input type="text" value={p.specialty}
                      onChange={(e) => setProfessionals((arr) => arr.map((x, j) => j === i ? { ...x, specialty: e.target.value } : x))}
                      placeholder="Ex: Barba & Navalha"
                      className="w-full px-3 py-2 border border-black/10 rounded-lg text-sm focus:outline-none" />
                  </div>
                </div>
              ))}
              {(plan.maxBarbers === Infinity || professionals.length < plan.maxBarbers) && (
                <button onClick={() => setProfessionals((p) => [...p, { name: '', specialty: '' }])}
                  className="w-full py-2.5 border-2 border-dashed border-black/15 rounded-xl text-sm text-gray-400 hover:border-[#1B3A4B] hover:text-[#1B3A4B] transition-colors">
                  + Adicionar profissional
                </button>
              )}
            </div>
          )}

          {/* Step 4 — Conclusão */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-black text-[#1B1C1E] mb-2">Tudo configurado!</h2>
              <p className="text-gray-500 mb-6">Seu link de agendamento já está ativo. Compartilhe com seus clientes!</p>
              {bookingLink && (
                <div className="bg-[#1B3A4B]/5 border border-[#1B3A4B]/20 rounded-xl p-4 flex items-center gap-3 mb-4">
                  <span className="flex-1 text-sm text-[#1B3A4B] font-medium truncate">{bookingLink}</span>
                  <button onClick={copyLink}
                    className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#1B3A4B] hover:text-[#1B3A4B]/70">
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <a href={bookingLink} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 text-[#1B3A4B] hover:text-[#1B3A4B]/70">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 max-w-lg">
          {step > 1 && step < 4 ? (
            <button onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1B1C1E]">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </button>
          ) : <div />}
          <button onClick={handleNext} disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors text-[#111111]"
            style={{ background: '#C89B3C' }}>
            {isSaving ? 'Salvando...' : step === 4 ? 'Acessar o painel' : 'Continuar'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
