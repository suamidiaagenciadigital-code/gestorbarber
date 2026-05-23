import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Briefcase, DollarSign, BarChart2, Zap, Home, Globe, Scissors } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/demo/dashboard' },
  { label: 'Agenda', icon: Calendar, path: '/demo/agenda' },
  { label: 'Clientes', icon: Users, path: '/demo/clientes' },
  { label: 'Serviços', icon: Briefcase, path: '/demo/servicos' },
  { label: 'Profissionais', icon: Scissors, path: '/demo/profissionais' },
  { label: 'Financeiro', icon: DollarSign, path: '/demo/financeiro' },
  { label: 'Relatórios', icon: BarChart2, path: '/demo/relatorios' },
  { label: 'AI Growth', icon: Zap, path: '/demo/ai-growth' },
];

function GBMark() {
  return (
    <div style={{ width: 36, height: 36, background: '#111111', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#F7F3EC', letterSpacing: '-0.5px', lineHeight: 1 }}>
        G<span style={{ color: '#C89B3C' }}>B</span>
      </span>
    </div>
  );
}

export default function DemoLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      {/* Demo Banner */}
      <div className="text-white text-center py-2.5 px-4 flex items-center justify-center gap-4 sticky top-0 z-50"
        style={{ background: '#111111' }}>
        <div className="flex items-center gap-2 text-sm font-medium">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C89B3C' }} />
          Modo Demonstração — dados fictícios, nenhuma ação é salva
        </div>
        <div className="hidden sm:flex items-center gap-3 ml-4">
          <Link to="/" className="text-xs text-white/60 hover:text-white underline">← Voltar ao site</Link>
          <a href="#planos">
            <span className="text-xs font-bold px-3 py-1 rounded-full hover:opacity-90 transition-colors"
              style={{ background: '#C89B3C', color: '#111111' }}>
              Contratar agora
            </span>
          </a>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-white border-r border-[#E8DED0] flex flex-col sticky top-10 h-screen overflow-y-auto">
          <div className="p-5 border-b border-[#E8DED0]">
            <div className="flex items-center gap-2.5">
              <GBMark />
              <div>
                <div className="font-bold text-sm text-[#111111]">Barbearia Demo</div>
                <div className="text-xs text-[#6B6258]">Gestor Barber</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-0.5">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-[#111111] text-white' : 'text-[#6B6258] hover:bg-[#F7F3EC] hover:text-[#111111]'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {item.label}
                  {item.label === 'AI Growth' && (
                    <span className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ background: '#C89B3C', color: '#111111' }}>AI</span>
                  )}
                </Link>
              );
            })}

            <a
              href={`${window.location.origin}/agendar/barbearia-demo`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: '#6B6258' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F7F3EC'; e.currentTarget.style.color = '#111111'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B6258'; }}
            >
              <Globe className="w-4 h-4 flex-shrink-0" />
              Link de Agendamento
            </a>
          </nav>

          <div className="p-4 border-t border-[#E8DED0]">
            <div className="rounded-2xl p-4 text-center" style={{ background: 'rgba(200,155,60,0.08)', border: '1px solid rgba(200,155,60,0.2)' }}>
              <p className="text-xs text-[#6B6258] mb-3">Gostou do que viu?</p>
              <Link to="/#planos" className="block">
                <button className="w-full text-[#F7F3EC] text-xs font-bold py-2 px-4 rounded-xl hover:opacity-90 transition-opacity"
                  style={{ background: '#C89B3C' }}>
                  Contratar Gestor Barber
                </button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
