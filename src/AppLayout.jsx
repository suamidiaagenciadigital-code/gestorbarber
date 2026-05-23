import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Briefcase, Scissors, DollarSign, BarChart2, Zap, Settings, UserCheck, Home, LogOut, Globe, ArrowLeft, Heart } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/lib/AuthContext';
import { useEffect } from 'react';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/app/dashboard' },
  { label: 'Agenda', icon: Calendar, path: '/app/agenda' },
  { label: 'Clientes', icon: Users, path: '/app/clientes' },
  { label: 'Serviços', icon: Briefcase, path: '/app/servicos' },
  { label: 'Profissionais', icon: Scissors, path: '/app/profissionais' },
  { label: 'Financeiro', icon: DollarSign, path: '/app/financeiro' },
  { label: 'Relatórios', icon: BarChart2, path: '/app/relatorios' },
  { label: 'AI Growth', icon: Zap, path: '/app/ai-growth' },
  { label: 'Fidelização', icon: Heart, path: '/app/fidelizacao' },
  { label: 'Equipe', icon: UserCheck, path: '/app/equipe' },
  { label: 'Configurações', icon: Settings, path: '/app/configuracoes' },
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

export default function AppLayout({ children }) {
  const location = useLocation();
  const { company } = useCompany();
  const { isSuperAdmin } = useAuth();
  const bookingLink = company?.slug ? `${window.location.origin}/agendar/${company.slug}` : null;

  const slugParam = isSuperAdmin ? new URLSearchParams(window.location.search).get('slug') : null;
  const withSlug = (path) => slugParam ? `${path}?slug=${slugParam}` : path;

  useEffect(() => {
    const companyName = company?.name;
    document.title = companyName ? `${companyName} | Gestor Barber` : 'Gestor Barber';
  }, [company?.name]);

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
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={withSlug(item.path)}
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
          {isSuperAdmin && (
            <Link to="/master"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B6258] hover:bg-warm-bg hover:text-foreground transition-all border-t border-border mt-2 pt-4">
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              Voltar ao Master
            </Link>
          )}
          {bookingLink && (
            <a href={bookingLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6B6258] hover:bg-warm-bg hover:text-foreground transition-all">
              <Globe className="w-4 h-4 flex-shrink-0" />
              Link de Agendamento
            </a>
          )}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 text-sm text-text-soft hover:text-destructive transition-colors w-full px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
