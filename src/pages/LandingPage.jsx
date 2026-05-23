import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp, ArrowRight, CheckCircle, Zap, BarChart2, Globe, MessageSquare, Scissors, DollarSign, Star, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingFAQ from '@/components/landing/LandingFAQ';
import LeadForm from '@/components/landing/LeadForm';
import WhatsAppFAB from '@/components/landing/WhatsAppFAB';

const WA_NUMBER = '5562983128765';
const waLink = (plan) =>
  `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Olá, tenho interesse no Gestor Barber e gostaria de saber mais sobre o plano ${plan}.`)}`;

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

const FEATURES = [
  { icon: Calendar, title: 'Agenda Inteligente', desc: 'Gerencie horários de todos os profissionais em uma visão unificada. Sem conflitos, sem esquecimentos.' },
  { icon: Users, title: 'Gestão de Clientes', desc: 'Histórico completo de atendimentos, preferências e contato. Fidelize quem já frequenta sua barbearia.' },
  { icon: Scissors, title: 'Equipe e Profissionais', desc: 'Cadastre barbeiros, defina comissões, controle serviços por profissional e acompanhe o desempenho.' },
  { icon: DollarSign, title: 'Controle Financeiro', desc: 'Entradas, saídas, relatórios de faturamento. Saiba exatamente quanto sua barbearia está gerando.' },
  { icon: BarChart2, title: 'Relatórios', desc: 'Dados reais sobre atendimentos, receita e clientes. Tome decisões baseadas em números, não em achismo.' },
  { icon: Zap, title: 'AI Growth', desc: 'Inteligência artificial que analisa seus dados e sugere ações concretas para aumentar a receita.' },
  { icon: Globe, title: 'Link de Agendamento', desc: 'Sua barbearia disponível 24h. Clientes agendam sozinhos pelo celular, sem precisar ligar.' },
  { icon: MessageSquare, title: 'Notificações Automáticas', desc: 'Lembretes de agendamento via WhatsApp. Reduza faltas e mantenha a agenda sempre cheia.' },
];

const STEPS = [
  { n: '01', title: 'Crie sua conta', desc: 'Cadastre sua barbearia em minutos. Sem contrato, sem complicação.' },
  { n: '02', title: 'Configure seu perfil', desc: 'Adicione seus profissionais, serviços e horários de atendimento.' },
  { n: '03', title: 'Compartilhe o link', desc: 'Envie o link de agendamento para seus clientes pelo WhatsApp ou Instagram.' },
  { n: '04', title: 'Gerencie tudo em um lugar', desc: 'Agenda, clientes, financeiro e relatórios — tudo no painel Gestor Barber.' },
];

const PLANS = [
  {
    name: 'Essencial', monthly: 59, annual: 47.20,
    desc: 'Para barbeiros autônomos ou pequenas barbearias que querem sair do WhatsApp e da agenda de papel.',
    features: ['Agenda online para marcação de horários', 'Cadastro de clientes', 'Controle básico de atendimentos', 'Link de agendamento para clientes', 'Painel simples do dia', 'Suporte por e-mail'],
    highlight: false, cta: 'Começar grátis',
  },
  {
    name: 'Profissional', monthly: 99, annual: 79.20,
    desc: 'Para barbearias em crescimento que precisam organizar equipe, agenda e resultados em um único lugar.',
    features: ['Tudo do plano Essencial', 'Gestão de barbeiros e equipe', 'Controle de comissões', 'Histórico completo de clientes', 'Relatórios de faturamento', 'Notificações automáticas via WhatsApp', 'Suporte prioritário'],
    highlight: true, badge: 'Mais popular', cta: 'Começar agora',
  },
  {
    name: 'Premium', monthly: 149, annual: 119.20,
    desc: 'Para barbearias premium ou redes que querem automação, IA e controle total do negócio.',
    features: ['Tudo do plano Profissional', 'AI Growth — insights inteligentes', 'Fidelização e retenção automática', 'Relatórios avançados', 'Configurações avançadas', 'Suporte premium com resposta rápida'],
    highlight: false, cta: 'Falar com especialista',
  },
];

const TESTIMONIALS = [
  { name: 'Rafael Costa', role: 'Proprietário — Barbearia Costa', text: 'Antes eu perdia horário toda semana porque o cliente esquecia. Com o Gestor Barber, as faltas caíram mais de 60% em dois meses.', stars: 5 },
  { name: 'Marcos Almeida', role: 'Barbeiro autônomo', text: 'Sempre tive medo de sistema. Esse é simples demais. Em 30 minutos já tinha meu link de agendamento rodando.', stars: 5 },
  { name: 'Cleber Santos', role: 'Dono — Corte Fino Barbearia', text: 'O relatório financeiro me fez perceber que eu ganhava mais de tarde do que de manhã. Mudei meus horários e faturei 20% a mais.', stars: 5 },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      {/* NAV */}
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
          <div className="flex items-center gap-3">
            <Link to="/admin/login" className="hidden md:block text-sm font-medium text-[#6B6258] hover:text-[#111111] transition-colors">Entrar</Link>
            <Link to="/demo/dashboard">
              <Button variant="outline" className="border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-all rounded-lg">
                Ver Demo
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-28 px-6" style={{ background: 'linear-gradient(160deg, #111111 0%, #2A241D 55%, #3D3228 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#C89B3C]/25">
              <Zap className="w-3 h-3" />Feito para barbearias que querem sair do improviso.
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 font-playfair">
              Sua barbearia mais organizada, profissional e pronta para crescer
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
              Controle agenda, clientes, equipe e resultados em um sistema simples, feito para barbearias que querem parar de improvisar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#planos">
                <button className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-lg transition-colors"
                  style={{ background: '#C89B3C', color: '#111111' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#B8892F'}
                  onMouseLeave={e => e.currentTarget.style.background = '#C89B3C'}>
                  Começar agora <ArrowRight className="w-5 h-5" />
                </button>
              </a>
              <Link to="/demo/dashboard">
                <button className="flex items-center gap-2 px-8 py-4 text-base font-medium rounded-lg border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all">
                  Ver demonstração
                </button>
              </Link>
            </div>
            <p className="text-sm text-white/35 mt-5">Sem complicação. Sem planilhas. Sem agenda perdida.</p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-16 px-6 bg-white border-b border-[#E8DED0]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '+500', label: 'Barbearias atendidas' },
            { value: '60%', label: 'Redução média de faltas' },
            { value: '4.9★', label: 'Avaliação dos clientes' },
            { value: '24h', label: 'Agendamento disponível' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-[#111111] mb-1">{s.value}</div>
              <div className="text-sm text-[#6B6258]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FUNCIONALIDADES */}
      <section id="funcionalidades" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/10 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#C89B3C]/20">
              Funcionalidades
            </div>
            <h2 className="text-4xl font-black text-[#111111] mb-4">Tudo que sua barbearia precisa, em um só lugar</h2>
            <p className="text-lg text-[#6B6258] max-w-2xl mx-auto">Chega de usar 4 aplicativos diferentes para fazer o trabalho de um só.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-[#E8DED0] hover:border-[#C89B3C]/40 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#111111] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-[#C89B3C]" />
                </div>
                <h3 className="font-bold text-[#111111] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6B6258] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-6 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#C89B3C]/25">
              Como Funciona
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Configurado em menos de 30 minutos</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">Sem necessidade de conhecimento técnico. Se você usa WhatsApp, você usa o Gestor Barber.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-px bg-white/10" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <span className="text-2xl font-black text-[#C89B3C]">{s.n}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-[#111111] mb-4">O que dizem os barbeiros</h2>
            <p className="text-lg text-[#6B6258]">Resultados reais de quem já usa o Gestor Barber.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#F7F3EC] rounded-2xl p-6 border border-[#E8DED0]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#C89B3C] text-[#C89B3C]" />
                  ))}
                </div>
                <p className="text-[#3D3228] leading-relaxed mb-4 text-sm">"{t.text}"</p>
                <div>
                  <div className="font-bold text-sm text-[#111111]">{t.name}</div>
                  <div className="text-xs text-[#6B6258]">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="py-24 px-6 bg-[#F7F3EC]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#C89B3C]/10 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border border-[#C89B3C]/20">
              Planos
            </div>
            <h2 className="text-4xl font-black text-[#111111] mb-4">Planos para cada momento do seu negócio</h2>
            <p className="text-lg text-[#6B6258] mb-8">Comece simples, cresça quando quiser. Sem fidelidade.</p>
            <div className="inline-flex items-center gap-3 bg-white rounded-xl p-1.5 border border-[#E8DED0]">
              <button onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? 'bg-[#111111] text-white' : 'text-[#6B6258]'}`}>
                Mensal
              </button>
              <button onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${annual ? 'bg-[#111111] text-white' : 'text-[#6B6258]'}`}>
                Anual <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-start">
            {PLANS.map(plan => (
              <div key={plan.name}
                className={`bg-white rounded-2xl p-8 border-2 transition-all relative ${plan.highlight ? 'border-[#C89B3C] shadow-xl scale-105' : 'border-[#E8DED0]'}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C89B3C] text-[#111111] text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <h3 className="text-xl font-black text-[#111111] mb-2">{plan.name}</h3>
                <p className="text-sm text-[#6B6258] mb-6 leading-relaxed">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-[#111111]">
                    R${annual ? plan.annual.toFixed(0) : plan.monthly}
                  </span>
                  <span className="text-[#6B6258] text-sm">/mês</span>
                  {annual && <div className="text-xs text-green-600 font-semibold mt-1">Cobrado anualmente</div>}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#3D3228]">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={waLink(plan.name)} target="_blank" rel="noopener noreferrer">
                  <button className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-[#C89B3C] text-[#111111] hover:bg-[#B8892F]'
                      : 'bg-[#111111] text-white hover:bg-[#333]'
                  }`}>
                    {plan.cta}
                  </button>
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#6B6258] mt-8 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> 7 dias grátis para testar. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" style={{ background: 'linear-gradient(135deg, #111111 0%, #2A241D 100%)' }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 font-playfair">
            Pronto para organizar sua barbearia?
          </h2>
          <p className="text-lg text-white/60 mb-10">
            Junte-se a centenas de barbearias que já pararam de improvisar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#planos">
              <button className="px-8 py-4 text-base font-bold rounded-lg transition-colors flex items-center gap-2"
                style={{ background: '#C89B3C', color: '#111111' }}
                onMouseEnter={e => e.currentTarget.style.background = '#B8892F'}
                onMouseLeave={e => e.currentTarget.style.background = '#C89B3C'}>
                Começar agora <ArrowRight className="w-5 h-5" />
              </button>
            </a>
            <Link to="/demo/dashboard">
              <button className="px-8 py-4 text-base font-medium rounded-lg border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all">
                Ver demonstração
              </button>
            </Link>
          </div>
        </div>
      </section>

      <LeadForm />

      <LandingFAQ />

      {/* FOOTER */}
      <footer className="py-16 px-6" style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 pb-12 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <GBMark size={8} />
                <span className="font-bold text-white">Gestor Barber</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">Sistema de gestão feito para barbearias que querem crescer com organização.</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><Link to="/demo/dashboard" className="hover:text-white transition-colors">Demonstração</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li><Link to="/termos" className="hover:text-white transition-colors">Termos de Uso</Link></li>
                <li><Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contato</h4>
              <ul className="space-y-2 text-sm text-white/40">
                <li>suamidiaideiascriativas@gmail.com</li>
                <li>Goiânia, Brasil</li>
                <li>
                  <a href={`https://wa.me/${WA_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/25 text-sm">© 2026 Gestor Barber. Todos os direitos reservados.</p>
            <p className="text-white/20 text-xs">Desenvolvido com ❤️ para barbearias brasileiras</p>
          </div>
        </div>
      </footer>

      <WhatsAppFAB />
    </div>
  );
}
