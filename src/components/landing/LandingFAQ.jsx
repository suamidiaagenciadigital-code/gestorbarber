import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Em quanto tempo minha barbearia está rodando?',
    a: 'Depois da configuração inicial, sua barbearia já pode começar a usar o sistema. Você cadastra serviços, equipe e agenda, e consegue testar tudo de forma simples antes de divulgar para os clientes.',
  },
  {
    q: 'Funciona em mais de uma unidade?',
    a: 'Sim. O Gestor Barber foi pensado para atender desde barbearias individuais até negócios com mais de uma unidade. Assim, você consegue manter uma visão mais organizada da operação.',
  },
  {
    q: 'Preciso instalar alguma coisa?',
    a: 'Não. O sistema funciona online, direto pelo navegador. Você pode acessar pelo computador, tablet ou celular, sem precisar instalar programas.',
  },
  {
    q: 'E os clientes, como agendam?',
    a: 'Os clientes podem receber um link de agendamento e escolher o melhor horário disponível. Isso ajuda a reduzir mensagens soltas no WhatsApp e deixa a rotina mais organizada.',
  },
  {
    q: 'Tem fidelidade ou posso cancelar a qualquer momento?',
    a: 'Os planos podem ser contratados de forma mensal ou anual. Caso escolha o mensal, você mantém mais flexibilidade para avaliar o sistema conforme a realidade da sua barbearia.',
  },
  {
    q: 'Como funciona o suporte?',
    a: 'O suporte ajuda na orientação de uso e nas principais dúvidas sobre o sistema. A ideia é que você consiga começar com segurança e evoluir sem depender de tentativa e erro.',
  },
];

export default function LandingFAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-[#111111] mb-3 font-playfair">Perguntas frequentes</h2>
          <p className="text-[#6B6258]">Respostas diretas para as dúvidas mais comuns antes de começar.</p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl border overflow-hidden transition-all"
              style={{ borderColor: open === i ? '#C89B3C' : '#E8DED0' }}
            >
              <button
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                style={{ background: open === i ? '#FFF8EE' : '#FFFFFF' }}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-semibold text-sm md:text-base text-[#111111]">{faq.q}</span>
                <ChevronDown
                  className="w-5 h-5 flex-shrink-0 transition-transform duration-200"
                  style={{ color: '#C89B3C', transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {open === i && (
                <div className="px-6 pb-5 text-sm text-[#6B6258] leading-relaxed border-t border-[#E8DED0]" style={{ background: '#FFF8EE' }}>
                  <p className="pt-4">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}