import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, ArrowRight, CheckCircle, Zap, BarChart2, Globe, Mail, MessageSquare, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LeadForm from '@/components/landing/LeadForm';
import WhatsAppFAB from '@/components/landing/WhatsAppFAB';

const WA_NUMBER = '5562983128765';
const waLink = (plan) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Olá, tenho interesse no Gestor Barber e gostaria de saber mais sobre o plano ${plan}.`)}`;

/* ── GB Logo mark ── */
function GBMark({ size = 9 }) {
  const px = size * 4;
  return (
    <div style={{ width: px, height: px, background: '#111111', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: px * 0.38, color: '#F7F3EC', letterSpacing: '-0.5px', lineHeight: 1 }}>
        G<span style={{ color: '#C89B3C' }}>B</span>
      </span>
    </div>
  );
}

const PLANS = [
  {
    name: 'Essencial',
    monthly: 59,
    annual: 47.20,
    desc: 'Para barbeiros autônomos, pequenas barbearias ou negócios que ainda organizam agenda no papel, WhatsApp ou planilhas.',
    features: [
      'Agenda online para marcação de horários',
      'Cadastro de clientes',
      'Controle básico de atendimentos',
      'Lembretes e organização da rotina',
      'Painel simples para acompanhar o dia',
      'Link de agendamento para enviar aos clientes',
      'Suporte básico',
    ],
    highlight: false,
    cta: 'Selecionar plano',
  },
  {
    name: 'Profissional',
    monthly: 99,
    annual: 79.20,
    desc: 'Para barbearias em crescimento que precisam organizar equipe, agenda, clientes e atendimento em um único lugar.',
    features: [
      'Tudo do plano Essencial',
      'Gestão de barbeiros e equipe',
      'Controle de serviços e comissões',
      'Histórico completo de clientes',
      'Relatórios de atendimentos e faturamento',
      'Painel com indicadores da barbearia',
      'Melhor organização da agenda por profissional',
      'Suporte prioritário',
    ],
    highlight: true,
    badge: 'Mais popular',
    cta: 'Começar agora',
  },
  {
    name: 'Premium',
    monthly: 149,
    annual: 119.20,
    desc: 'Para barbearias premium, redes, franquias ou negócios que querem mais controle, automação e visão de crescimento.',
    features: [
      'Tudo do plano Profissional',
      'Gestão avançada de unidades e equipe',
      'Relatórios completos de desempenho',
      'Controle de clientes recorrentes',
      'Recursos para fidelização',
      'Acompanhamento de metas e resultados',
      'Configurações avançadas da barbearia',
      'Suporte premium',
    ],
    highlight: false,
    cta: 'Selecionar plano',
  },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#F7F3EC]/95 backdrop-blur border-b border-[#E8DED0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <GBMark size={8} />
            <span className="font-bold text-lg text-[#111111] tracking-tight">Gestor Barber</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6258]">
            <a href="#funcionalidades" className="hover:text-[#111111] transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-[#111111] transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-[#111111] transition-colors">Planos</a>
            <Link to="/demo/dashboard" className="hover:text-[#111111] transition-colors">Demo</Link>
          </div>
          <Link to="/demo/dashboard">
            <Button variant="outline" className="border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-all rounded-lg">
              Ver Demo
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-28 px-6" style={{ background: 'linear-gradient(160deg, #111111 0%, #2A241D 55%, #3D3228 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#C89B3C]/25">
              <Zap className="w-3 h-3" />
              Feito para barbearias que querem sair do improviso.
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 font-playfair">
              Sua barbearia mais organizada, profissional e pronta para crescer
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mb-10 leading-relaxed font-inter">
              Controle agenda, clientes, equipe e resultados em um sistema simples, feito para barbearias que querem sair do improviso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#planos">
                <button className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-lg transition-colors"
                  style={{ background: '#C89B3C', color: '#111111' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#B8892F'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C89B3C'}>
                  Começar agora
                  <ArrowRight className="w-5 h-5" />
                </button>
              </a>
              <a href="#funcionalidades">
                <button className="flex items-center gap-2 px-8 py-4 text-base font-medium rounded-lg border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all">
                  Ver funcionalidades
                </button>
              </a>
            </div>
            <p className="text-sm text-white/35 mt-5">Sem complicação. Sem planilhas. Sem agenda perdida.</p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6" style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '2.400+', label: 'Barbearias ativas' },
            { value: '180k+', label: 'Agendamentos/mês' },
            { value: '98%', label: 'Taxa de retenção' },
            { value: '4.9★', label: 'Avaliação média' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black mb-1 font-playfair" style={{ color: '#C89B3C' }}>{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="funcionalidades" className="py-24 px-6 bg-[#F7F3EC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#111111] mb-4 font-playfair">O que muda na sua rotina</h2>
            <p className="text-lg text-[#6B6258] max-w-xl mx-auto">Cada parte do sistema foi pensada para tornar sua operação mais clara e sua gestão mais profissional.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Agenda sempre organizada', desc: 'Seus horários ficam claros, seus clientes são lembrados e sua cadeira trabalha melhor.' },
              { icon: Users, title: 'Clientes mais próximos', desc: 'Cada atendimento vira relacionamento, histórico e oportunidade de fazer o cliente voltar.' },
              { icon: TrendingUp, title: 'Dinheiro mais claro', desc: 'Você entende melhor o que entra, o que sai e onde sua barbearia pode melhorar.' },
              { icon: Globe, title: 'Equipe no controle', desc: 'Cada profissional sabe sua rotina, seus atendimentos e seus resultados com mais clareza.' },
              { icon: BarChart2, title: 'Decisões sem achismo', desc: 'Veja o que está funcionando e tome decisões com base no movimento real da barbearia.' },
              { icon: Zap, title: 'Crescimento com IA', desc: 'Receba ideias e caminhos para atrair, reter e vender mais com inteligência.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-[#E8DED0] p-8 hover:shadow-lg transition-all hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(200,155,60,0.1)' }}>
                  <f.icon className="w-6 h-6" style={{ color: '#C89B3C' }} />
                </div>
                <h3 className="text-lg font-bold text-[#111111] mb-2">{f.title}</h3>
                <p className="text-[#6B6258] text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-[#111111] mb-4 font-playfair">Como funciona</h2>
            <p className="text-[#6B6258] text-lg">Três passos para sua barbearia funcionar com mais organização</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Cadastre sua barbearia', desc: 'Comece com os dados principais do seu negócio.' },
              { step: '02', title: 'Configure agenda, equipe e serviços', desc: 'Organize horários, profissionais e atendimentos em poucos passos.' },
              { step: '03', title: 'Atenda mais, fature melhor', desc: 'Tenha mais controle para crescer com consistência.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-5 font-playfair"
                  style={{ background: '#111111', color: '#C89B3C' }}>
                  {s.step}
                </div>
                <h3 className="font-bold text-[#111111] mb-2 text-sm md:text-base">{s.title}</h3>
                <p className="text-[#6B6258] text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Diferencial Extra ── */}
      <section className="py-20 px-6 bg-[#F7F3EC]">
        <div className="max-w-5xl mx-auto">
          <div className="bg-[#111111] rounded-3xl p-10 md:p-14 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(200,155,60,0.15)' }}>
              <TrendingUp className="w-10 h-10" style={{ color: '#C89B3C' }} />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4 font-playfair">Mais controle, menos improviso.</h2>
              <p className="text-white/60 leading-relaxed text-base md:text-lg">
                O Gestor Barber foi criado para barbearias que querem parar de depender de agenda bagunçada, mensagens perdidas no WhatsApp e controle feito no caderno.<br className="hidden md:block" />
                <span className="block mt-3">Com ele, sua barbearia ganha mais organização, mais clareza e mais tempo para focar no que realmente importa: <span style={{ color: '#C89B3C' }}>atender bem e vender mais.</span></span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Growth ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border"
              style={{ background: 'rgba(200,155,60,0.1)', color: '#C89B3C', borderColor: 'rgba(200,155,60,0.25)' }}>
              <Zap className="w-3 h-3" />
              AI Growth Engine
            </div>
            <h2 className="text-4xl font-black text-[#111111] mb-6 font-playfair">IA que trabalha enquanto você corta</h2>
            <p className="text-[#6B6258] mb-8 leading-relaxed">O sistema analisa automaticamente seus clientes, identifica quem está sumindo, detecta padrões de frequência e gera mensagens prontas para você enviar no WhatsApp e trazer de volta.</p>
            <div className="space-y-3">
              {['Detecção de clientes inativos', 'Análise de horários fracos', 'Mensagens prontas para reativação', 'Insights de serviços com baixa demanda'].map(f => (
                <div key={f} className="flex items-center gap-3 text-sm font-medium text-[#171717]">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#C89B3C' }} />
                  {f}
                </div>
              ))}
            </div>
            <div className="mt-8">
              <Link to="/demo/ai-growth">
                <button className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-[#111111] transition-colors"
                  style={{ background: '#C89B3C' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#B8892F'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C89B3C'}>
                  Ver AI Growth na Demo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
          <div className="bg-[#F7F3EC] rounded-2xl border border-[#E8DED0] p-8 space-y-4">
            {[
              { title: '12 clientes inativos detectados', sub: 'Última visita há +30 dias. Mensagem pronta para enviar.', badge: 'Reativar', bg: '#FFF4E0', color: '#92680C' },
              { title: 'Segunda-feira às 14h está vazia', sub: 'Horário com 0 agendamentos nas últimas 4 semanas.', badge: 'Oportunidade', bg: '#EFF6FF', color: '#1D4ED8' },
              { title: '8 clientes VIP sem retorno', sub: 'Clientes que gastaram +R$500 não voltam há 21 dias.', badge: 'VIP', bg: '#FFF4E0', color: '#92680C' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-4 p-4 bg-white rounded-xl border border-[#E8DED0]">
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#111111] mb-1">{item.title}</div>
                  <div className="text-xs text-[#6B6258]">{item.sub}</div>
                </div>
                <span className="text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: item.bg, color: item.color }}>{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="planos" className="py-24 px-6 bg-[#F7F3EC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-[#111111] mb-3 font-playfair">Planos para cada estágio da sua barbearia</h2>
            <p className="text-[#6B6258] mb-8">Escolha o que faz mais sentido para onde você está hoje.</p>

            {/* Toggle mensal/anual */}
            <div className="inline-flex items-center gap-3 bg-white border border-[#E8DED0] rounded-xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={!annual ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                style={annual ? { background: '#111111', color: '#F7F3EC' } : { color: '#6B6258' }}>
                Anual
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#C89B3C', color: '#111111' }}>-20%</span>
              </button>
            </div>
            {annual && <p className="text-xs text-[#6B6258] mt-3">Cobrado anualmente. Economize 20% em relação ao plano mensal.</p>}
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map(p => {
              const price = annual ? p.annual : p.monthly;
              const priceStr = price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              return (
                <div key={p.name} className="rounded-2xl border flex flex-col relative"
                  style={p.highlight
                    ? { background: '#111111', borderColor: '#C89B3C' }
                    : { background: '#FFFFFF', borderColor: '#E8DED0' }}>

                  {p.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap"
                        style={{ background: '#C89B3C', color: '#111111' }}>
                        {p.badge}
                      </span>
                    </div>
                  )}

                  <div className="p-8 flex-1">
                    <div className="text-sm font-semibold mb-1" style={{ color: p.highlight ? 'rgba(247,243,236,0.5)' : '#6B6258' }}>{p.name}</div>
                    <div className="flex items-end gap-1 mb-1">
                      <span className="text-4xl font-black font-playfair" style={{ color: p.highlight ? '#C89B3C' : '#111111' }}>
                        R$ {priceStr}
                      </span>
                      <span className="text-sm mb-1" style={{ color: p.highlight ? 'rgba(247,243,236,0.4)' : '#9CA3AF' }}>/mês</span>
                    </div>
                    {annual && (
                      <div className="text-xs mb-2" style={{ color: p.highlight ? '#C89B3C' : '#16A34A' }}>
                        Você paga R$ {(p.annual * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                      </div>
                    )}
                    <p className="text-xs leading-relaxed mb-6" style={{ color: p.highlight ? 'rgba(247,243,236,0.55)' : '#6B6258' }}>{p.desc}</p>

                    <div className="space-y-2.5">
                      {p.features.map(f => (
                        <div key={f} className="flex items-start gap-2 text-sm" style={{ color: p.highlight ? 'rgba(247,243,236,0.85)' : '#374151' }}>
                          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#C89B3C' }} />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-8 pb-8">
                    <a href={waLink(p.name)} target="_blank" rel="noopener noreferrer">
                      <button className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                        style={p.highlight
                          ? { background: '#C89B3C', color: '#111111' }
                          : { background: '#111111', color: '#F7F3EC' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                        {p.cta}
                      </button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(160deg, #111111 0%, #2A241D 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-playfair">Chega de improvisar. Comece a gerenciar.</h2>
          <p className="text-white/60 text-lg mb-10">Veja como o Gestor Barber funciona na prática antes de qualquer decisão.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo/dashboard">
              <button className="flex items-center gap-2 px-10 py-4 text-base font-bold rounded-xl transition-colors"
                style={{ background: '#C89B3C', color: '#111111' }}
                onMouseEnter={e => e.currentTarget.style.background = '#B8892F'}
                onMouseLeave={e => e.currentTarget.style.background = '#C89B3C'}>
                Ver Demo Gratuita
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <a href={waLink('Profissional')} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 px-10 py-4 text-base font-medium rounded-xl border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all">
                <MessageSquare className="w-5 h-5" />
                Falar pelo WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <LandingFAQ />

      {/* ── Lead Form ── */}
      <LeadForm />

      {/* ── Footer ── */}
      <footer className="py-16 px-6" style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <GBMark size={8} />
                <div>
                  <div className="font-bold text-white">Gestor Barber</div>
                  <div className="text-xs text-white/40">Sua barbearia no controle.</div>
                </div>
              </div>
              <p className="text-white/40 text-sm leading-relaxed max-w-xs">
                Sistema completo de gestão para barbearias modernas. Organize, cresça e atenda melhor.
              </p>
              <div className="flex items-center gap-4 mt-5">
                <a href="mailto:suamidiaideiascriativas@gmail.com" className="text-white/40 hover:text-[#C89B3C] transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
                <a href={waLink('Gestor Barber')} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#C89B3C] transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </a>
                <a href="https://instagram.com/suamidiaideiascriativas" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#C89B3C] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Links rápidos */}
            <div>
              <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Navegação</div>
              <div className="space-y-2.5">
                {[
                  { label: 'Funcionalidades', href: '#funcionalidades' },
                  { label: 'Como Funciona', href: '#como-funciona' },
                  { label: 'Planos', href: '#planos' },
                  { label: 'Demo', to: '/demo/dashboard' },
                ].map(l => (
                  l.to
                    ? <Link key={l.label} to={l.to} className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">{l.label}</Link>
                    : <a key={l.label} href={l.href} className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">{l.label}</a>
                ))}
              </div>
            </div>

            {/* Contato + Políticas */}
            <div>
              <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">Contato</div>
              <div className="space-y-2.5 mb-6">
                <a href="mailto:suamidiaideiascriativas@gmail.com" className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">
                  suamidiaideiascriativas@gmail.com
                </a>
                <a href={waLink('Gestor Barber')} target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">
                  (62) 98312-8765
                </a>
                <a href="https://instagram.com/suamidiaideiascriativas" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">
                  @suamidiaideiascriativas
                </a>
                <div className="text-sm text-white/30">Goiânia, Brasil</div>
              </div>
              <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">Legal</div>
              <div className="space-y-2">
                <Link to="/termos" className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">Termos de Uso</Link>
                <Link to="/privacidade" className="block text-sm text-white/50 hover:text-[#C89B3C] transition-colors">Política de Privacidade</Link>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/25 text-sm">© 2026 Gestor Barber. Todos os direitos reservados.</p>
            <p className="text-white/20 text-xs">Goiânia, Brasil · suamidiaideiascriativas@gmail.com</p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp FAB ── */}
      <WhatsAppFAB />
    </div>
  );
}
