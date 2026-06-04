import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { Eye, EyeOff, Check, ArrowRight, ArrowLeft, Scissors, ShieldCheck } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PLANS = [
  {
    name: 'Essencial',
    monthly: 59,
    annual: 47.20,
    annualTotal: 566.40,
    desc: 'Para barbeiros autônomos que trabalham sozinhos.',
  },
  {
    name: 'Profissional',
    monthly: 99,
    annual: 79.20,
    annualTotal: 950.40,
    desc: 'Para barbearias em crescimento com equipe.',
    highlight: true,
  },
  {
    name: 'Premium',
    monthly: 149,
    annual: 119.20,
    annualTotal: 1430.40,
    desc: 'Para barbearias premium que querem o máximo.',
  },
];

const toSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 30);

const fmt = (n) => n.toFixed(2).replace('.', ',');

export default function Cadastrar() {
  const [params] = useSearchParams();

  const [step, setStep] = useState(1);
  const [billing, setBilling] = useState('monthly');
  const [plan, setPlan] = useState(() => {
    const raw = params.get('plano') || '';
    const map = { essencial: 'Essencial', profissional: 'Profissional', premium: 'Premium' };
    return map[raw.toLowerCase()] || 'Profissional';
  });

  const [form, setForm] = useState({
    owner_nome: '', owner_email: '', password: '', confirm_password: '',
    barbershop_name: '', slug: '',
  });
  const [slugAuto, setSlugAuto] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState('');

  const selectedPlan = PLANS.find(p => p.name === plan);
  const displayPrice = billing === 'annual' ? selectedPlan?.annual : selectedPlan?.monthly;
  const savings = selectedPlan ? (selectedPlan.monthly - selectedPlan.annual) * 12 : 0;

  const handleNameChange = (val) => {
    setForm(p => ({ ...p, barbershop_name: val, ...(slugAuto && { slug: toSlug(val) }) }));
  };
  const handleSlugChange = (val) => {
    setSlugAuto(false);
    setForm(p => ({ ...p, slug: toSlug(val) }));
  };

  const validate = () => {
    if (!form.owner_nome) return 'Informe seu nome.';
    if (!form.owner_email || !/\S+@\S+\.\S+/.test(form.owner_email)) return 'E-mail inválido.';
    if (form.password.length < 8) return 'Senha deve ter ao menos 8 caracteres.';
    if (form.password !== form.confirm_password) return 'As senhas não coincidem.';
    if (!form.barbershop_name) return 'Informe o nome da barbearia.';
    if (!form.slug) return 'Defina o link de agendamento.';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);

    try {
      const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

      // 1. Criar conta
      const { data: signupData, error: signupErr } = await supabase.functions.invoke('self-signup', {
        body: {
          barbershop_name: form.barbershop_name,
          slug: form.slug,
          owner_nome: form.owner_nome,
          owner_email: form.owner_email,
          password: form.password,
          plan_name: plan,
          test_mode: isTestMode,
        },
      });

      if (signupErr || !signupData?.company_id) {
        let msg = 'Erro ao criar conta.';
        if (signupData?.error) msg = signupData.error;
        else if (signupErr) {
          try { const b = await signupErr.context?.json?.(); if (b?.error) msg = b.error; } catch {}
        }
        setError(msg);
        setLoading(false);
        return;
      }

      const origin = window.location.origin;

      if (isTestMode) {
        window.location.href = `${origin}/cadastrar/sucesso?email=${encodeURIComponent(form.owner_email)}&test=true`;
        return;
      }

      // 2. Criar sessão de checkout embutida
      const { data: checkoutData, error: checkoutErr } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          company_id: signupData.company_id,
          plan_name: plan,
          billing_period: billing,
          owner_email: form.owner_email,
          ui_mode: 'embedded',
          return_url: `${origin}/cadastrar/sucesso?email=${encodeURIComponent(form.owner_email)}&session_id={CHECKOUT_SESSION_ID}`,
        },
      });

      if (checkoutErr || !checkoutData?.client_secret) {
        // Rollback: remove empresa criada
        await supabase.functions.invoke('self-signup', {
          body: { action: 'rollback', company_id: signupData.company_id },
        });
        setError(checkoutData?.error || checkoutErr?.message || 'Erro ao iniciar pagamento. Tente novamente.');
        setLoading(false);
        return;
      }

      setClientSecret(checkoutData.client_secret);
      setStep(3);
    } catch (e) {
      // Tenta extrair mensagem real da Edge Function (FunctionsHttpError)
      let msg = 'Erro inesperado. Tente novamente.';
      try {
        const body = await e.context?.json?.();
        if (body?.error) msg = body.error;
        else if (e.message && !e.message.includes('non-2xx')) msg = e.message;
      } catch {}
      setError(msg);
    }
    setLoading(false);
  };

  const STEPS = ['Plano', 'Conta', 'Pagamento'];

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-inter flex flex-col">
      {/* Header */}
      <header className="bg-[#111111] px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#C89B3C]/20 rounded-lg flex items-center justify-center">
            <Scissors className="w-4 h-4 text-[#C89B3C]" />
          </div>
          <span className="font-bold text-white">Gestor<span className="text-[#C89B3C]">Barber</span></span>
        </Link>
        <Link to="/admin/login" className="text-xs text-white/50 hover:text-white transition-colors">
          Já tenho conta →
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {/* Indicador de etapas */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => {
              const s = i + 1;
              const done = s < step;
              const active = s === step;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${done ? 'bg-[#C89B3C] text-white' : active ? 'bg-[#1B3A4B] text-white' : 'bg-black/10 text-gray-400'}`}>
                      {done ? <Check className="w-4 h-4" /> : s}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block ${active ? 'text-[#1B1C1E]' : 'text-gray-400'}`}>{label}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`w-12 h-0.5 mb-4 ${done ? 'bg-[#C89B3C]' : 'bg-black/10'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── PASSO 1: Plano + Cobrança ── */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black text-[#1B1C1E] mb-1 text-center">Escolha seu plano</h1>
              <p className="text-gray-500 text-sm text-center mb-6">Você pode cancelar a qualquer momento.</p>

              {/* Toggle mensal / anual */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-1 bg-white border border-[#E8DED0] rounded-xl p-1">
                  <button onClick={() => setBilling('monthly')}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                    style={billing === 'monthly' ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
                    Mensal
                  </button>
                  <button onClick={() => setBilling('annual')}
                    className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                    style={billing === 'annual' ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
                    Anual
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                      style={{ background: '#C89B3C', color: '#111111' }}>-20%</span>
                  </button>
                </div>
              </div>

              {billing === 'annual' && (
                <p className="text-xs text-center text-green-600 font-medium mb-4">
                  💰 Você economiza R$ {fmt(savings)} por ano no plano {plan}
                </p>
              )}

              <div className="space-y-3 mb-6">
                {PLANS.map(p => {
                  const price = billing === 'annual' ? p.annual : p.monthly;
                  const isSelected = plan === p.name;
                  return (
                    <button key={p.name} onClick={() => setPlan(p.name)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4
                        ${isSelected ? 'border-[#C89B3C] bg-[#C89B3C]/5' : 'border-black/10 bg-white hover:border-black/20'}`}>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                        ${isSelected ? 'border-[#C89B3C] bg-[#C89B3C]' : 'border-gray-300'}`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1B1C1E]">{p.name}</span>
                          {p.highlight && (
                            <span className="text-xs font-semibold bg-[#C89B3C] text-white px-2 py-0.5 rounded-full">Mais popular</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                        {billing === 'annual' && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            R$ {fmt(p.annualTotal)}/ano — economize R$ {fmt((p.monthly - p.annual) * 12)}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-[#1B1C1E] text-sm">R$ {fmt(price)}</span>
                        <span className="text-xs text-gray-400">/mês</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button onClick={() => setStep(2)}
                className="w-full bg-[#1B3A4B] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#1B3A4B]/90 transition-colors">
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── PASSO 2: Dados da conta ── */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-black text-[#1B1C1E] mb-1 text-center">Crie sua conta</h1>
              <p className="text-gray-500 text-sm text-center mb-6">
                Plano <strong>{plan}</strong> · {billing === 'annual' ? 'Anual' : 'Mensal'} · R$ {fmt(displayPrice ?? 0)}/mês ·{' '}
                <button onClick={() => setStep(1)} className="text-[#C89B3C] hover:underline">trocar</button>
              </p>

              <div className="bg-white rounded-2xl border border-black/8 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Seu nome *</label>
                    <input type="text" value={form.owner_nome}
                      onChange={e => setForm(p => ({ ...p, owner_nome: e.target.value }))}
                      placeholder="João Silva"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">E-mail *</label>
                    <input type="email" value={form.owner_email}
                      onChange={e => setForm(p => ({ ...p, owner_email: e.target.value }))}
                      placeholder="joao@barbearia.com"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Senha *</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={form.password}
                        onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="Mín. 8 caracteres"
                        className="w-full px-3 py-2.5 pr-9 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                      <button type="button" onClick={() => setShowPass(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmar senha *</label>
                    <input type={showPass ? 'text' : 'password'} value={form.confirm_password}
                      onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))}
                      placeholder="Repita a senha"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                </div>

                <hr className="border-black/8" />

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nome da barbearia *</label>
                  <input type="text" value={form.barbershop_name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Ex: Studio 47 Barbearia"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Link de agendamento *</label>
                  <div className="flex items-center border border-black/10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A4B]/20">
                    <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-black/10 whitespace-nowrap">/agendar/</span>
                    <input type="text" value={form.slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder="studio47"
                      className="flex-1 px-3 py-2.5 text-sm focus:outline-none" />
                  </div>
                  {form.slug && (
                    <p className="text-xs text-[#1B3A4B] mt-1">{window.location.origin}/agendar/{form.slug}</p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg">{error}</div>
                )}

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-[#C89B3C] text-[#111111] py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#B8892F] transition-colors disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-[#111]/20 border-t-[#111] rounded-full animate-spin" /> Criando conta...</>
                    : <> Continuar para pagamento <ArrowRight className="w-4 h-4" /></>}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Ao continuar, você concorda com os{' '}
                  <Link to="/termos" className="underline hover:text-gray-600">Termos de Uso</Link>{' '}e{' '}
                  <Link to="/privacidade" className="underline hover:text-gray-600">Política de Privacidade</Link>.
                </p>
              </div>

              <button onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-4 mx-auto">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            </div>
          )}

          {/* ── PASSO 3: Checkout embutido ── */}
          {step === 3 && clientSecret && (
            <div>
              <h1 className="text-2xl font-black text-[#1B1C1E] mb-1 text-center">Dados de pagamento</h1>
              <p className="text-gray-500 text-sm text-center mb-2">
                Plano <strong>{plan}</strong> · {billing === 'annual' ? 'Anual' : 'Mensal'} · R$ {fmt(displayPrice ?? 0)}/mês
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 mb-6">
                <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                Pagamento 100% seguro via Stripe
              </div>
              <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
                <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
