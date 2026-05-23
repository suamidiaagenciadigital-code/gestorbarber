import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Briefcase, Scissors, DollarSign, BarChart2, Zap, Home } from 'lucide-react';

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

function GBLogo({ size = 8 }) {
  const px = size * 4;
  return (
    <div style={{ width: px, height: px, background: '#111111', borderRadius: 10 }}
      className="flex items-center justify-center flex-shrink-0">
      <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: px * 0.38, color: '#F7F3EC', letterSpacing: '-0.5px', lineHeight: 1 }}>
        G<span style={{ color: '#C89B3C' }}>B</span>
      </span>
    </div>
  );
}

export default function DemoLayout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-warm-bg font-inter flex">
      <aside className="w-64 min-h-screen bg-white border-r border-border flex flex-col fixed h-screen overflow-y-auto z-40">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <GBLogo size={9} />
            <div>
              <div className="font-bold text-sm text-foreground font-inter">Gestor Barber</div>
              <div className="text-xs text-text-soft">Painel de gestão</div>
            </div>
          </div>
        </div>
        <div className="mx-3 mt-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700">Modo Demo</p>
          <p className="text-xs text-amber-600 mt-0.5">Dados fictícios para visualização</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 mt-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-[#111111] text-white' : 'text-[#6B6258] hover:bg-warm-bg hover:text-foreground'
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {item.label === 'AI Growth' && (
                  <span className="ml-auto text-xs bg-[#C89B3C] text-[#111111] font-bold px-1.5 py-0.5 rounded">AI</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <Link to="/admin/login"
            className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#111111] hover:bg-[#333] transition-colors w-full px-3 py-2 rounded-lg">
            Entrar na plataforma
          </Link>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
