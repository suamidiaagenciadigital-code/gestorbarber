import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#6B6258] hover:text-[#111111] mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-2xl border border-[#E8DED0] p-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(200,155,60,0.1)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 18, color: '#C89B3C' }}>🔒</span>
          </div>
          <h1 className="text-3xl font-black text-[#111111] mb-2 font-playfair">Política de Privacidade</h1>
          <p className="text-sm text-[#6B6258] mb-8">Gestor Barber · Última atualização: em breve</p>

          <div className="bg-[#FFF4E0] border border-[#C89B3C]/30 rounded-xl p-5 text-sm text-[#92680C] leading-relaxed">
            <strong>Aviso:</strong> Este documento está em construção. A Política de Privacidade completa do Gestor Barber será publicada em breve, em conformidade com a LGPD (Lei Geral de Proteção de Dados). Entre em contato pelo e-mail{' '}
            <a href="mailto:suamidiaideiascriativas@gmail.com" className="underline">suamidiaideiascriativas@gmail.com</a>{' '}
            caso tenha dúvidas.
          </div>
        </div>
      </div>
    </div>
  );
}