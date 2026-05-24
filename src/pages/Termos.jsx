import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-black text-[#111111] mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-[#4A4540] leading-relaxed">{children}</div>
    </div>
  );
}

export default function Termos() {
  return (
    <div className="min-h-screen bg-[#F7F3EC] font-inter">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-[#6B6258] hover:text-[#111111] mb-10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>

        <div className="bg-white rounded-2xl border border-[#E8DED0] p-10">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(200,155,60,0.1)' }}>
            <span style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: 18, color: '#C89B3C' }}>§</span>
          </div>
          <h1 className="text-3xl font-black text-[#111111] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Termos de Uso</h1>
          <p className="text-sm text-[#6B6258] mb-10">Gestor Barber · Última atualização: maio de 2025</p>

          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar ou utilizar a plataforma Gestor Barber, operada por <strong>Sua Mídia Ideias Criativas</strong>, você concorda com estes Termos de Uso em sua totalidade. Caso não concorde com qualquer disposição, não utilize o serviço.
            </p>
            <p>
              Estes termos se aplicam a todos os usuários da plataforma, incluindo proprietários de barbearias, profissionais cadastrados e clientes que realizam agendamentos.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              O Gestor Barber é uma plataforma SaaS (Software as a Service) voltada à gestão de barbearias, oferecendo funcionalidades como agenda online, cadastro de clientes, controle financeiro, agendamento público via link, gestão de equipe e recursos de inteligência artificial para crescimento do negócio.
            </p>
            <p>
              O serviço é disponibilizado mediante assinatura mensal, conforme o plano contratado. A Sua Mídia Ideias Criativas se reserva o direito de modificar, suspender ou descontinuar funcionalidades a qualquer momento, mediante aviso prévio.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <p>
              Para utilizar a plataforma, é necessário criar uma conta com dados verdadeiros e atualizados. O titular da conta é responsável por manter a confidencialidade das credenciais de acesso e por todas as atividades realizadas em seu nome.
            </p>
            <p>
              É proibido compartilhar credenciais de acesso entre usuários diferentes, salvo quando a funcionalidade de múltiplos usuários estiver habilitada pelo plano contratado.
            </p>
            <p>
              A Sua Mídia Ideias Criativas pode recusar ou cancelar o cadastro de qualquer usuário que viole estes termos ou a legislação aplicável.
            </p>
          </Section>

          <Section title="4. Planos e Pagamentos">
            <p>
              O Gestor Barber é oferecido em diferentes planos de assinatura, com cobranças mensais processadas por meio de gateway de pagamento seguro. Os valores vigentes estão disponíveis na página de planos do site.
            </p>
            <p>
              O não pagamento dentro do prazo pode resultar na suspensão do acesso até a regularização. A reativação ocorre automaticamente após a confirmação do pagamento.
            </p>
            <p>
              Não há reembolso de mensalidades já pagas, exceto nos casos previstos pelo Código de Defesa do Consumidor (Lei nº 8.078/1990), como o direito de arrependimento de 7 dias a partir da primeira contratação realizada a distância.
            </p>
          </Section>

          <Section title="5. Uso Permitido">
            <p>O usuário se compromete a utilizar a plataforma somente para fins lícitos e de acordo com estes termos. É expressamente proibido:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Utilizar o serviço para fins ilegais, fraudulentos ou prejudiciais a terceiros;</li>
              <li>Tentar acessar áreas restritas da plataforma sem autorização;</li>
              <li>Inserir dados falsos, enganosos ou que violem direitos de terceiros;</li>
              <li>Realizar engenharia reversa, copiar ou distribuir qualquer parte do código ou interface da plataforma;</li>
              <li>Utilizar scripts automatizados para acessar ou sobrecarregar os servidores da plataforma.</li>
            </ul>
          </Section>

          <Section title="6. Dados dos Clientes da Barbearia">
            <p>
              O proprietário da barbearia é o controlador dos dados pessoais de seus clientes cadastrados na plataforma. A Sua Mídia Ideias Criativas atua como operadora, processando esses dados exclusivamente para viabilizar o funcionamento do serviço contratado.
            </p>
            <p>
              O usuário é responsável por obter o consentimento adequado de seus clientes para o tratamento de dados e por cumprir as obrigações decorrentes da LGPD (Lei nº 13.709/2018).
            </p>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              Todos os elementos da plataforma Gestor Barber — incluindo marca, logotipo, design, código-fonte, textos e recursos de inteligência artificial — são de propriedade exclusiva da Sua Mídia Ideias Criativas, protegidos pela legislação de propriedade intelectual brasileira.
            </p>
            <p>
              A contratação do serviço não transfere ao usuário qualquer direito sobre a propriedade intelectual da plataforma, sendo concedida apenas uma licença de uso limitada, não exclusiva e intransferível.
            </p>
          </Section>

          <Section title="8. Cancelamento e Rescisão">
            <p>
              O usuário pode cancelar sua assinatura a qualquer momento pelo painel de controle ou entrando em contato com o suporte. O acesso permanecerá ativo até o final do período já pago.
            </p>
            <p>
              A Sua Mídia Ideias Criativas pode rescindir o contrato imediatamente em caso de violação destes termos, uso fraudulento ou determinação legal, sem prejuízo de outras medidas cabíveis.
            </p>
          </Section>

          <Section title="9. Limitação de Responsabilidade">
            <p>
              A plataforma é fornecida "como está", sem garantias de disponibilidade ininterrupta. A Sua Mídia Ideias Criativas não se responsabiliza por perdas indiretas, lucros cessantes ou danos decorrentes de falhas de terceiros (como operadoras de internet ou processadores de pagamento).
            </p>
            <p>
              A responsabilidade máxima da Sua Mídia Ideias Criativas, em qualquer hipótese, fica limitada ao valor pago pelo usuário nos últimos 3 meses de assinatura.
            </p>
          </Section>

          <Section title="10. Alterações nos Termos">
            <p>
              Estes termos podem ser atualizados periodicamente. Alterações relevantes serão comunicadas por e-mail ou notificação na plataforma com antecedência mínima de 15 dias. O uso continuado após a vigência das alterações implica aceitação dos novos termos.
            </p>
          </Section>

          <Section title="11. Foro e Lei Aplicável">
            <p>
              Estes termos são regidos pelas leis da República Federativa do Brasil. Eventuais disputas serão submetidas ao foro da comarca de <strong>São Paulo — SP</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </Section>

          <div className="border-t border-[#E8DED0] pt-8 mt-8">
            <p className="text-sm text-[#6B6258]">
              Dúvidas?{' '}
              <a href="mailto:suporte@gestorbarber.ia.br" className="text-[#1B3A4B] font-semibold hover:underline">
                suporte@gestorbarber.ia.br
              </a>
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Sua Mídia Ideias Criativas · CNPJ em processo de atualização · gestorbarber.ia.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
