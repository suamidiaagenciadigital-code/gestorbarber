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
            <span style={{ fontSize: 22 }}>🔒</span>
          </div>
          <h1 className="text-3xl font-black text-[#111111] mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Política de Privacidade</h1>
          <p className="text-sm text-[#6B6258] mb-10">Gestor Barber · Última atualização: maio de 2025 · Em conformidade com a LGPD (Lei nº 13.709/2018)</p>

          <Section title="1. Quem somos">
            <p>
              A <strong>Sua Mídia Ideias Criativas</strong> é a empresa responsável pela plataforma <strong>Gestor Barber</strong> (gestorbarber.ia.br). Para fins da LGPD, atuamos como <strong>controladora</strong> dos dados dos usuários da plataforma e como <strong>operadora</strong> dos dados dos clientes finais das barbearias.
            </p>
            <p>
              Contato do encarregado (DPO): <a href="mailto:privacidade@gestorbarber.ia.br" className="text-[#1B3A4B] font-semibold hover:underline">privacidade@gestorbarber.ia.br</a>
            </p>
          </Section>

          <Section title="2. Dados que coletamos">
            <p><strong>Dados dos usuários da plataforma (proprietários e equipe):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome e e-mail para criação de conta;</li>
              <li>Dados da barbearia: nome fantasia, CNPJ/CPF, endereço, telefone, WhatsApp;</li>
              <li>Dados de pagamento processados pelo Stripe (não armazenamos dados de cartão diretamente);</li>
              <li>Logs de acesso: data/hora de login, IP, dispositivo.</li>
            </ul>
            <p className="mt-3"><strong>Dados dos clientes das barbearias (inseridos pelos usuários):</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome, telefone/WhatsApp e e-mail (quando fornecidos);</li>
              <li>Histórico de agendamentos e serviços realizados;</li>
              <li>Observações cadastradas pelos profissionais.</li>
            </ul>
            <p className="mt-3"><strong>Dados coletados automaticamente:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dados de navegação e uso da plataforma (páginas acessadas, funcionalidades utilizadas);</li>
              <li>Cookies essenciais de sessão e autenticação.</li>
            </ul>
          </Section>

          <Section title="3. Como utilizamos seus dados">
            <p>Utilizamos os dados coletados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Criar e gerenciar contas de acesso à plataforma;</li>
              <li>Processar pagamentos e emitir cobranças;</li>
              <li>Enviar comunicações transacionais (confirmações, lembretes de pagamento, acesso ao sistema);</li>
              <li>Melhorar funcionalidades e corrigir erros da plataforma;</li>
              <li>Enviar comunicações de marketing, desde que o usuário tenha consentido;</li>
              <li>Cumprir obrigações legais e regulatórias.</li>
            </ul>
          </Section>

          <Section title="4. Base legal para o tratamento">
            <p>O tratamento de dados é realizado com base nas seguintes hipóteses previstas na LGPD:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Execução de contrato</strong> — para viabilizar o serviço contratado;</li>
              <li><strong>Legítimo interesse</strong> — para segurança, prevenção a fraudes e melhoria do serviço;</li>
              <li><strong>Consentimento</strong> — para envio de comunicações de marketing;</li>
              <li><strong>Cumprimento de obrigação legal</strong> — quando exigido por lei ou autoridade competente.</li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento de dados">
            <p>Não vendemos dados pessoais a terceiros. Compartilhamos dados apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Stripe</strong> — processamento de pagamentos, com sede nos EUA, adequado às exigências da LGPD via cláusulas contratuais padrão;</li>
              <li><strong>Supabase</strong> — infraestrutura de banco de dados e autenticação;</li>
              <li><strong>Resend</strong> — envio de e-mails transacionais;</li>
              <li><strong>Anthropic (Claude)</strong> — processamento de funcionalidades de IA, sem retenção de dados para treinamento;</li>
              <li><strong>Autoridades públicas</strong> — quando exigido por lei, decisão judicial ou regulatória.</li>
            </ul>
            <p>Todos os fornecedores são selecionados com base em suas políticas de privacidade e segurança.</p>
          </Section>

          <Section title="6. Armazenamento e segurança">
            <p>
              Os dados são armazenados em servidores seguros, com criptografia em trânsito (TLS/HTTPS) e em repouso. Adotamos controles de acesso baseados em funções (RBAC), autenticação segura com hash de senhas e monitoramento contínuo de acessos.
            </p>
            <p>
              Em caso de incidente de segurança que possa afetar dados pessoais, notificaremos os titulares afetados e a ANPD dentro dos prazos legais.
            </p>
          </Section>

          <Section title="7. Retenção de dados">
            <p>
              Mantemos os dados dos usuários enquanto a conta estiver ativa. Após o cancelamento, os dados são retidos por até <strong>90 dias</strong> para fins de backup e resolução de disputas, sendo então excluídos ou anonimizados.
            </p>
            <p>
              Dados necessários para cumprimento de obrigações fiscais ou legais podem ser mantidos pelos prazos exigidos pela legislação aplicável (em geral, 5 anos).
            </p>
          </Section>

          <Section title="8. Seus direitos como titular de dados">
            <p>De acordo com a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Confirmação e acesso</strong> — saber quais dados tratamos sobre você;</li>
              <li><strong>Correção</strong> — solicitar a atualização de dados incompletos ou desatualizados;</li>
              <li><strong>Eliminação</strong> — pedir a exclusão de dados tratados com base em consentimento;</li>
              <li><strong>Portabilidade</strong> — receber seus dados em formato estruturado;</li>
              <li><strong>Revogação do consentimento</strong> — retirar o consentimento a qualquer momento;</li>
              <li><strong>Oposição</strong> — se opor ao tratamento realizado com base em legítimo interesse.</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, entre em contato pelo e-mail{' '}
              <a href="mailto:privacidade@gestorbarber.ia.br" className="text-[#1B3A4B] font-semibold hover:underline">privacidade@gestorbarber.ia.br</a>.
              Responderemos em até 15 dias úteis.
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              Utilizamos cookies estritamente necessários para autenticação e funcionamento da plataforma. Não utilizamos cookies de rastreamento publicitário de terceiros. Você pode configurar seu navegador para bloquear cookies, mas isso pode afetar o funcionamento do sistema.
            </p>
          </Section>

          <Section title="10. Transferência internacional de dados">
            <p>
              Alguns de nossos fornecedores de infraestrutura (Supabase, Stripe, Anthropic) estão localizados fora do Brasil. Essas transferências são realizadas com base em mecanismos de proteção adequados, conforme exigido pela LGPD e regulamentações da ANPD.
            </p>
          </Section>

          <Section title="11. Alterações nesta política">
            <p>
              Esta política pode ser atualizada periodicamente. Notificaremos usuários sobre alterações relevantes por e-mail ou aviso na plataforma. A versão mais recente estará sempre disponível em gestorbarber.ia.br/privacidade.
            </p>
          </Section>

          <div className="border-t border-[#E8DED0] pt-8 mt-8">
            <p className="text-sm text-[#6B6258]">
              Dúvidas ou solicitações relacionadas à privacidade?{' '}
              <a href="mailto:privacidade@gestorbarber.ia.br" className="text-[#1B3A4B] font-semibold hover:underline">
                privacidade@gestorbarber.ia.br
              </a>
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Sua Mídia Ideias Criativas · gestorbarber.ia.br · ANPD: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="hover:underline">gov.br/anpd</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
