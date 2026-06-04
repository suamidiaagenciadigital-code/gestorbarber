import { useState, useEffect } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  Calendar, Users, Briefcase, Scissors, DollarSign, BarChart2,
  Zap, Settings, UserCheck, Home, LogOut, Globe, ArrowLeft, Heart,
  Menu, X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'Dashboard',      icon: Home,      path: '/app/dashboard' },
  { label: 'Agenda',         icon: Calendar,  path: '/app/agenda' },
  { label: 'Clientes',       icon: Users,     path: '/app/clientes' },
  { label: 'Serviços',       icon: Briefcase, path: '/app/servicos' },
  { label: 'Profissionais',  icon: Scissors,  path: '/app/profissionais' },
  { label: 'Financeiro',     icon: DollarSign,path: '/app/financeiro' },
  { label: 'Relatórios',     icon: BarChart2, path: '/app/relatorios' },
  { label: 'AI Growth',      icon: Zap,       path: '/app/ai-growth', badge: 'AI' },
  { label: 'Fidelização',    icon: Heart,     path: '/app/fidelizacao' },
  { label: 'Equipe',         icon: UserCheck, path: '/app/equipe' },
  { label: 'Configurações',  icon: Settings,  path: '/app/configuracoes' },
];

// Itens fixos na bottom bar do mobile (os 4 mais usados + "Mais")
const bottomItems = [
  { label: 'Início',      icon: Home,      path: '/app/dashboard' },
  { label: 'Agenda',      icon: Calendar,  path: '/app/agenda' },
  { label: 'Clientes',    icon: Users,     path: '/app/clientes' },
  { label: 'Financeiro',  icon: DollarSign,path: '/app/financeiro' },
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
  const navigate = useNavigate();
  const { company, companyId, isLoading: loadingCompany } = useCompany();
  const { isSuperAdmin, setAdminSession } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    if (isSuperAdmin) {
      await handleLogout();
      navigate('/');
    } else {
      setAdminSession(null);
      navigate('/admin/login');
    }
  };

  const bookingLink = company?.slug ? `${window.location.origin}/agendar/${company.slug}` : null;
  const slugParam = isSuperAdmin ? new URLSearchParams(window.location.search).get('slug') : null;
  const withSlug = (path) => slugParam ? `${path}?slug=${slugParam}` : path;

  useEffect(() => {
    const companyName = company?.name;
    document.title = companyName ? `${companyName} | Gestor Barber` : 'Gestor Barber';
  }, [company?.name]);

  // Fechar drawer ao navegar
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  if (isSuperAdmin && !loadingCompany && !companyId) {
    return <Navigate to="/master" replace />;
  }
  if (!isSuperAdmin && !loadingCompany && company && !company.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-bg font-inter flex">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 min-h-screen bg-white border-r border-border flex-col fixed h-screen overflow-y-auto z-40">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <GBLogo size={9} />
            <div>
              <div className="font-bold text-sm text-foreground font-inter">Gestor Barber</div>
              <div className="text-xs text-text-soft truncate max-w-[140px]">{company?.name || 'Painel de gestão'}</div>
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
                {item.badge && (
                  <span className="ml-auto text-xs bg-[#C89B3C] text-[#111111] font-bold px-1.5 py-0.5 rounded">{item.badge}</span>
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
          <button onClick={() => handleLogout()}
            className="flex items-center gap-2 text-sm text-text-soft hover:text-destructive transition-colors w-full px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile Top Header ───────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-border safe-area-top">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2.5">
            <GBLogo size={8} />
            <div className="min-w-0">
              <div className="font-bold text-sm text-[#1B1C1E] leading-tight">Gestor Barber</div>
              <div className="text-xs text-gray-400 truncate max-w-[180px]">{company?.name || ''}</div>
            </div>
          </div>
          <button
            onClick={() => handleLogout()}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="flex-1 md:ml-64 min-h-screen pt-14 md:pt-0 pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Mobile Bottom Navigation ────────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border safe-area-bottom">
        <div className="flex items-stretch h-16">
          {bottomItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={withSlug(item.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
                <item.icon className={`w-5 h-5 transition-colors ${active ? 'text-[#111111]' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-medium transition-colors ${active ? 'text-[#111111] font-bold' : 'text-gray-400'}`}>
                  {item.label}
                </span>
                {active && <div className="absolute bottom-0 w-8 h-0.5 bg-[#111111] rounded-t-full" />}
              </Link>
            );
          })}

          {/* Botão "Mais" — abre o drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
            <Menu className="w-5 h-5 text-gray-400" />
            <span className="text-[10px] font-medium text-gray-400">Mais</span>
          </button>
        </div>
      </nav>

      {/* ── "Mais" Drawer (mobile) ──────────────────────────────────── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setDrawerOpen(false)}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Sheet deslizando de baixo */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[82vh] flex flex-col"
            onClick={e => e.stopPropagation()}>

            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-black/6">
              <div className="flex flex-col items-center w-full">
                <div className="w-10 h-1 bg-gray-200 rounded-full mb-3" />
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Menu completo</p>
              <button onClick={() => setDrawerOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Nav items */}
            <div className="overflow-y-auto flex-1 px-3 pb-4">
              <div className="space-y-0.5">
                {navItems.map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={withSlug(item.path)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                        active ? 'bg-[#111111] text-white' : 'text-[#4A4540] hover:bg-[#F8F7F3]'
                      }`}>
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {item.label}
                      {item.badge && (
                        <span className="ml-auto text-xs bg-[#C89B3C] text-[#111111] font-bold px-2 py-0.5 rounded-md">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Extras */}
              <div className="mt-3 pt-3 border-t border-black/6 space-y-0.5">
                {bookingLink && (
                  <a href={bookingLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-[#4A4540] hover:bg-[#F8F7F3] transition-all">
                    <Globe className="w-5 h-5 flex-shrink-0" />
                    Link de Agendamento
                  </a>
                )}
                {isSuperAdmin && (
                  <Link to="/master"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-[#4A4540] hover:bg-[#F8F7F3] transition-all">
                    <ArrowLeft className="w-5 h-5 flex-shrink-0" />
                    Voltar ao Master
                  </Link>
                )}
                <button onClick={() => handleLogout()}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full text-left">
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  Sair da conta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
