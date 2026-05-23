import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminTrocarSenha() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { adminSession, setAdminSession } = useAuth();

  const token = params.get('token'); // for reset-senha flow
  const isReset = !!token;

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // If not reset flow and no session, redirect to login
    if (!isReset && !adminSession) {
      navigate('/admin/login', { replace: true });
    }
  }, [isReset, adminSession, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (novaSenha.length < 8) { setError('A senha deve ter pelo menos 8 caracteres'); return; }
    if (novaSenha !== confirmar) { setError('As senhas não coincidem'); return; }
    setError('');
    setLoading(true);

    let res;
    if (isReset) {
      res = await base44.functions.invoke('barbeariaUserActions', {
        action: 'reset_password', token, nova_senha: novaSenha,
      });
    } else {
      res = await base44.functions.invoke('barbeariaUserActions', {
        action: 'change_password',
        user_id: adminSession.user.id,
        nova_senha: novaSenha,
      });
    }

    setLoading(false);
    if (res.data?.success) {
      if (adminSession) {
        const updated = { ...adminSession, user: { ...adminSession.user, forcar_troca_senha: false } };
        setAdminSession(updated);
      }
      setDone(true);
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } else {
      setError(res.data?.error || 'Erro ao trocar senha');
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F3EC] flex items-center justify-center p-4 font-inter">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#111111' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 20, color: '#F7F3EC' }}>
              G<span style={{ color: '#C89B3C' }}>B</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#1B1C1E]">
            {isReset ? 'Redefinir senha' : 'Trocar senha'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {isReset ? 'Crie uma nova senha para sua conta' : 'Por segurança, defina uma nova senha'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 p-6 shadow-sm">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-[#1B1C1E]">Senha alterada com sucesso!</p>
              <p className="text-sm text-gray-400 mt-1">Redirecionando...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    required
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3 py-2.5 pr-10 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20"
                  />
                  <button type="button" onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 block mb-1">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A4B]/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-[#111111] rounded-lg font-semibold text-sm disabled:opacity-60"
                style={{ background: '#C89B3C' }}
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
