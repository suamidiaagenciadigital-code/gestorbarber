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
  { name: 'Essencial', monthly: 59, annual: 47.20, desc: 'Para barbeiros autônomos, pequenas barbearias ou negócios que ainda organizam agenda no papel, WhatsApp ou planilhas.', features: ['Agenda online para marcação de horários','Cadastro de clientes','Controle básico de atendimentos','Lembretes e organização da rotina','Painel simples para acompanhar o dia','Link de agendamento para enviar aos clientes','Suporte básico'], highlight: false, cta: 'Selecionar plano' },
  { name: 'Profissional', monthly: 99, annual: 79.20, desc: 'Para barbearias em crescimento que precisam organizar equipe, agenda, clientes e atendimento em um único lugar.', features: ['Tudo do plano Essencial','Gestão de barbeiros e equipe','Controle de serviços e comissões','Histórico completo de clientes','Relatórios de atendimentos e faturamento','Painel com indicadores da barbearia','Melhor organização da agenda por profissional','Suporte prioritário'], highlight: true, badge: 'Mais popular', cta: 'Começar agora' },
  { name: 'Premium', monthly: 149, annual: 119.20, desc: 'Para barbearias premium, redes, franquias ou negócios que querem mais controle, automação e visão de crescimento.', features: ['Tudo do plano Profissional','Gestão avançada de unidades e equipe','Relatórios completos de desempenho','Controle de clientes recorrentes','Recursos para fidelização','Acompanhamento de metas e resultados','Configurações avançadas da barbearia','Suporte premium'], highlight: false, cta: 'Selecionar plano' },
];

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);
  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <nav className="fixed top-0 w-full z-50 bg-[#F7F3EC]/95 backdrop-blur border-b border-[#E8DED0]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5"><GBMark size={8} /><span className="font-bold text-lg text-[#111111] tracking-tight">Gestor Barber</span></div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B6258]">
            <a href="#funcionalidades" className="hover:text-[#111111] transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-[#111111] transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-[#111111] transition-colors">Planos</a>
            <Link to="/demo/dashboard" className="hover:text-[#111111] transition-colors">Demo</Link>
          </div>
          <Link to="/demo/dashboard"><Button variant="outline" className="border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white transition-all rounded-lg">Ver Demo</Button></Link>
        </div>
      </nav>
      <section className="pt-32 pb-28 px-6" style={{ background: 'linear-gradient(160deg, #111111 0%, #2A241D 55%, #3D3228 100%)' }}>
        <div className="max-w-7xl mx-auto"><div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-[#C89B3C]/15 text-[#C89B3C] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-[#C89B3C]/25"><Zap className="w-3 h-3" />Feito para barbearias que querem sair do improviso.</div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6 font-playfair">Sua barbearia mais organizada, profissional e pronta para crescer</h1>
          <p className="text-xl text-white/60 max-w-2xl mb-10 leading-relaxed font-inter">Controle agenda, clientes, equipe e resultados em um sistema simples, feito para barbearias que querem sair do improviso.</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#planos"><button className="flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-lg transition-colors" style={{ background: '#C89B3C', color: '#111111' }} onMouseEnter={e => e.currentTarget.style.background='#B8892F'} onMouseLeave={e => e.currentTarget.style.background='#C89B3C'}>Começar agora<ArrowRight className="w-5 h-5" /></button></a>
            <a href="#funcionalidades"><button className="flex items-center gap-2 px-8 py-4 text-base font-medium rounded-lg border border-white/30 text-white hover:border-white hover:bg-white/10 transition-all">Ver funcionalidades</button></a>
          </div>
          <p className="text-sm text-white/35 mt-5">Sem complicação. Sem planilhas. Sem agenda perdida.</p>
        </div></div>
      </section>
      <LandingFAQ />
      <LeadForm />
      <footer className="py-16 px-6" style={{ background: '#111111' }}>
        <div className="max-w-7xl mx-auto">
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/25 text-sm">© 2026 Gestor Barber. Todos os direitos reservados.</p>
            <p className="text-white/20 text-xs">Goiânia, Brasil · suamidiaideiascriativas@gmail.com</p>
          </div>
        </div>
      </footer>
      <WhatsAppFAB />
    </div>
  );
}
