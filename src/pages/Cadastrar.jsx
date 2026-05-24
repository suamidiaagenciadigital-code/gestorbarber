import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, Check, ArrowRight, ArrowLeft, Scissors } from 'lucide-react';

const PLANS = [
  {
    name: 'Essencial',
    price: 'R$ 59/mês',
    desc: 'Para barbeiros autônomos que trabalham sozinhos.',
    color: '#1B3A4B',
  },
  {
    name: 'Profissional',
    price: 'R$ 99/mês',
    desc: 'Para barbearias em crescimento com equipe.',
    color: '#C89B3C',
    highlight: true,
  },
  {
    name: 'Premium',
    price: 'R$ 149/mês',
    desc: 'Para redes e franquias com múltiplas unidades.',
    color: '#1B3A4B',
  },
];

const toSlug = (str) =>
  str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '').slice(0, 30);

export default function Cadastrar() {
  const [params] = useSearchParams();
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(params.get('plano') || 'Profissional');
  const [form, setForm] = useState({ owner_nome: '', owner_email: '', password: '', confirm_password: '', barbershop_name: '', slug: '' });
  const [slugAuto, setSlugAuto] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize plan name from URL param
  useEffect(() => {
    const raw = params.get('plano') || '';
    const map = { essencial: 'Essencial', profissional: 'Profissional', premium: 'Premium' };
    setPlan(map[raw.toLowerCase()] || 'Profissional');
  }, [params]);

  const handleNameChange = (val) => {
    setForm((p) => ({ ...p, barbershop_name: val, ...(slugAuto && { slug: toSlug(val) }) }));
  };

  const handleSlugChange = (val) => {
    setSlugAuto(false);
    setForm((p) => ({ ...p, slug: toSlug(val) }));
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

      // 1. Create account
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
        if (signupData?.error) {
          msg = signupData.error;
        } else if (signupErr) {
          try { const b = await signupErr.context?.json?.(); if (b?.error) msg = b.error; } catch {}
        }
        setError(msg);
        setLoading(false);
        return;
      }

      const origin = window.location.origin;

      if (isTestMode) {
        // TEST MODE: skip Stripe, go straight to success page
        window.location.href = `${origin}/cadastrar/sucesso?email=${encodeURIComponent(form.owner_email)}&test=true`;
        return;
      }

      // 2. Create Stripe Checkout Session
      const { data: checkoutData, error: checkoutErr } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          company_id: signupData.company_id,
          plan_name: plan,
          owner_email: form.owner_email,
          success_url: `${origin}/cadastrar/sucesso?email=${encodeURIComponent(form.owner_email)}`,
          cancel_url: `${origin}/cadastrar?plano=${plan.toLowerCase()}`,
        },
      });

      if (checkoutErr || !checkoutData?.checkout_url) {
        // Rollback: delete the company so the email isn't permanently blocked
        await supabase.functions.invoke('self-signup', {
          body: { action: 'rollback', company_id: signupData.company_id },
        });
        setError(checkoutData?.error || checkoutErr?.message || 'Erro ao iniciar pagamento. Tente novamente.');
        setLoading(false);
        return;
      }

      // 3. Redirect to Stripe
      window.location.href = checkoutData.checkout_url;
    } catch (e) {
      setError(e.message || 'Erro inesperado.');
      setLoading(false);
    }
  };

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
        <Link to="/admin/login" className="text-xs text-white/50 hover:text-white">Já tenho conta →</Link>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                  ${s < step ? 'bg-[#C89B3C] text-white' : s === step ? 'bg-[#1B3A4B] text-white' : 'bg-black/10 text-gray-400'}`}>
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 2 && <div className={`w-16 h-0.5 ${s < step ? 'bg-[#C89B3C]' : 'bg-black/10'}`} />}
              </div>
            ))}
          </div>

          {/* STEP 1 — Plan selection */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-black text-[#1B1C1E] mb-1 text-center">Escolha seu plano</h1>
              <p className="text-gray-500 text-sm text-center mb-6">Você pode mudar a qualquer momento.</p>

              <div className="space-y-3 mb-6">
                {PLANS.map((p) => (
                  <button key={p.name} onClick={() => setPlan(p.name)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4
                      ${plan === p.name ? 'border-[#C89B3C] bg-[#C89B3C]/5' : 'border-black/10 bg-white hover:border-black/20'}`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                      ${plan === p.name ? 'border-[#C89B3C] bg-[#C89B3C]' : 'border-gray-300'}`}>
                      {plan === p.name && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1B1C1E]">{p.name}</span>
                        {p.highlight && <span className="text-xs font-semibold bg-[#C89B3C] text-white px-2 py-0.5 rounded-full">Mais popular</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{p.desc}</p>
                    </div>
                    <span className="font-bold text-[#1B1C1E] text-sm whitespace-nowrap">{p.price}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep(2)}
                className="w-full bg-[#1B3A4B] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#1B3A4B]/90 transition-colors">
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2 — Form */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-black text-[#1B1C1E] mb-1 text-center">Crie sua conta</h1>
              <p className="text-gray-500 text-sm text-center mb-6">
                Plano <strong>{plan}</strong> · <button onClick={() => setStep(1)} className="text-[#C89B3C] hover:underline">trocar</button>
              </p>

              <div className="bg-white rounded-2xl border border-black/8 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Seu nome *</label>
                    <input type="text" value={form.owner_nome} onChange={(e) => setForm((p) => ({ ...p, owner_nome: e.target.value }))}
                      placeholder="João Silva"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 block mb-1">E-mail *</label>
                    <input type="email" value={form.owner_email} onChange={(e) => setForm((p) => ({ ...p, owner_email: e.target.value }))}
                      placeholder="joao@barbearia.com"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Senha *</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        placeholder="Mín. 8 caracteres"
                        className="w-full px-3 py-2.5 pr-9 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                      <button type="button" onClick={() => setShowPass((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmar senha *</label>
                    <input type={showPass ? 'text' : 'password'} value={form.confirm_password}
                      onChange={(e) => setForm((p) => ({ ...p, confirm_password: e.target.value }))}
                      placeholder="Repita a senha"
                      className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                  </div>
                </div>

                <hr className="border-black/8" />

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Nome da barbearia *</label>
                  <input type="text" value={form.barbershop_name} onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Studio 47 Barbearia"
                    className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-1">Link de agendamento *</label>
                  <div className="flex items-center border border-black/10 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1B3A4B]/20">
                    <span className="px-3 py-2.5 text-xs text-gray-400 bg-gray-50 border-r border-black/10 whitespace-nowrap">/agendar/</span>
                    <input type="text" value={form.slug} onChange={(e) => handleSlugChange(e.target.value)}
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
                  {loading ? 'Criando conta...' : 'Criar conta e ir para pagamento'}
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Ao continuar, você concorda com os{' '}
                  <Link to="/termos" className="underline hover:text-gray-600">Termos de Uso</Link>{' e '}
                  <Link to="/privacidade" className="underline hover:text-gray-600">Política de Privacidade</Link>.
                </p>
              </div>

              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-4 mx-auto">
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
