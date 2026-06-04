import { Link, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { BookOpen, LogOut } from 'lucide-react';

export default function MasterHeader({ active }) {
  const navigate = useNavigate();

  const navLinks = [
    { to: '/master',            label: 'Início' },
    { to: '/master/barbearias', label: 'Barbearias' },
    { to: '/master/financeiro', label: 'Financeiro' },
    { to: '/master/conteudo',   label: 'Conteúdo' },
  ];

  return (
    <header className="bg-[#111111] text-white px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(200,155,60,0.2)' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 13, color: '#C89B3C', letterSpacing: '-0.5px' }}>GB</span>
        </div>
        <div>
          <div className="font-bold text-sm">Gestor Barber — Master</div>
          <div className="text-xs text-white/50">Painel Super Admin</div>
        </div>
      </div>

      <nav className="flex items-center gap-1">
        {navLinks.map(link => (
          <Link key={link.to} to={link.to}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              active === link.to
                ? 'bg-white/15 text-white font-semibold'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}>
            {link.label}
          </Link>
        ))}
        <div className="w-px h-4 bg-white/20 mx-2" />
        <button
          onClick={async () => { await base44.auth.logout(); navigate('/'); }}
          className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-white/10">
          <LogOut className="w-3.5 h-3.5" />Sair
        </button>
      </nav>
    </header>
  );
}
