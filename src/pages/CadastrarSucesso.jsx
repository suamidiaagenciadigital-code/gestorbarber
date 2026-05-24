import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Mail, ArrowRight, Clock } from 'lucide-react';

export default function CadastrarSucesso() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-inter flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-black text-[#1B1C1E] mb-2">Pagamento confirmado!</h1>
        <p className="text-gray-500 mb-6">
          Sua barbearia está sendo configurada. Em instantes você receberá um e-mail com os dados de acesso.
        </p>

        {email && (
          <div className="bg-white rounded-2xl border border-black/8 p-4 flex items-center gap-3 mb-6 text-left">
            <div className="w-10 h-10 bg-[#1B3A4B]/10 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#1B3A4B]" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">E-mail de acesso enviado para</p>
              <p className="text-sm font-bold text-[#1B1C1E]">{email}</p>
            </div>
          </div>
        )}

        <div className="bg-[#1B3A4B]/5 border border-[#1B3A4B]/15 rounded-xl p-4 flex items-start gap-3 mb-8 text-left">
          <Clock className="w-4 h-4 text-[#1B3A4B] mt-0.5 shrink-0" />
          <p className="text-xs text-[#1B3A4B]">
            A ativação pode levar até 2 minutos após a confirmação do pagamento.
            Se não receber o e-mail, verifique a caixa de spam.
          </p>
        </div>

        <Link to="/admin/login">
          <button className="w-full bg-[#1B3A4B] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#1B3A4B]/90 transition-colors">
            Acessar o painel <ArrowRight className="w-4 h-4" />
          </button>
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          Precisa de ajuda?{' '}
          <a href="https://wa.me/5562983128765" target="_blank" rel="noopener noreferrer" className="text-[#C89B3C] hover:underline">
            Fale conosco pelo WhatsApp
          </a>
        </p>
      </div>
    </div>
  );
}
