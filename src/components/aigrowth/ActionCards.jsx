import { useState } from 'react';
import { Zap, RefreshCw, ArrowRight, Copy, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const AI_CARD_STYLES = [
  { border: '#C89B3C', tagBg: '#FFF8E8', tagText: '#92680C' },
  { border: '#1B3A4B', tagBg: '#EFF6FF', tagText: '#1D4ED8' },
  { border: '#22C55E', tagBg: '#F0FDF4', tagText: '#15803D' },
];

export default function ActionCards({ company, customers, appointments, services, professionals }) {
  const [aiCards, setAiCards] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [copied, setCopied] = useState(null);

  const now = new Date();

  // Clientes inativos
  const inactiveCount = customers.filter(c => {
    if (!c.last_appointment_at) return false;
    const days = Math.floor((now - new Date(c.last_appointment_at)) / 86400000);
    return days > (company?.retention_interval_days || 45);
  }).length;

  // Profissional mais ocupado no mês
  const proLoad = {};
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  appointments.filter(a => new Date(a.scheduled_at) >= monthStart).forEach(a => {
    if (a.professional_name) proLoad[a.professional_name] = (proLoad[a.professional_name] || 0) + 1;
  });
  const totalMonthAppts = appointments.filter(a => new Date(a.scheduled_at) >= monthStart).length;
  const busiestPro = Object.entries(proLoad).sort((a, b) => b[1] - a[1])[0];
  const busiestPct = busiestPro && totalMonthAppts > 0 ? Math.round((busiestPro[1] / totalMonthAppts) * 100) : 0;

  // Dia mais fraco — só considera dias que a barbearia está aberta
  const dayNames   = ['Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];
  const dayKeyMap  = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const recentAppts = appointments.filter(a => new Date(a.scheduled_at) >= threeMonthsAgo);
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  recentAppts.forEach(a => { dayCounts[new Date(a.scheduled_at).getDay()]++; });
  const hasEnoughData = recentAppts.length >= 7;

  // Filtra apenas dias em que a barbearia funciona
  const openDayIndices = [0,1,2,3,4,5,6].filter(i => {
    const key = dayKeyMap[i];
    if (!company?.business_hours) return i !== 0; // fallback: exclui domingo
    return company.business_hours[key]?.active === true;
  });

  const weakestDayIdx = hasEnoughData && openDayIndices.length > 0
    ? openDayIndices.reduce((minI, i) => (dayCounts[i] < dayCounts[minI] ? i : minI), openDayIndices[0])
    : null;
  const weakestDay = weakestDayIdx !== null ? dayNames[weakestDayIdx] : null;
  const openDayNames = openDayIndices.map(i => dayNames[i]);

  // Serviço mais lucrativo
  const serviceRevenue = {};
  appointments.filter(a => a.status === 'concluido' && a.service_name && a.price).forEach(a => {
    serviceRevenue[a.service_name] = (serviceRevenue[a.service_name] || 0) + a.price;
  });

  const staticCards = [
    inactiveCount > 0 && {
      id: 'inactive',
      color: '#FFF3E0',
      border: '#F5A623',
      tag: 'Urgente',
      tagBg: '#FFF3E0',
      tagText: '#B45309',
      title: `Voce tem ${inactiveCount} cliente${inactiveCount > 1 ? 's' : ''} sumido${inactiveCount > 1 ? 's' : ''} ha mais de ${company?.retention_interval_days || 45} dias`,
      desc: 'Disparar campanha de retorno agora — cada cliente perdido custa 5x mais para recuperar.',
      action: 'Ir para Fidelizacao',
      href: '/app/fidelizacao',
      whatsapp: `Oi [Nome]! Ja faz um tempinho que nao te vemos por aqui. Temos horarios disponiveis essa semana, bora agendar?`,
    },
    busiestPro && busiestPct >= 70 && {
      id: 'busy_pro',
      color: '#F0FDF4',
      border: '#22C55E',
      tag: 'Oportunidade',
      tagBg: '#F0FDF4',
      tagText: '#15803D',
      title: `${busiestPro[0]} esta com ${busiestPct}% dos atendimentos do mes`,
      desc: `Alta demanda concentrada. Considere aumentar o preco dos servicos de ${busiestPro[0]} ou criar lista de espera.`,
      action: 'Ver Profissionais',
      href: '/app/profissionais',
      whatsapp: null,
    },
    weakestDay && {
      id: 'weak_day',
      color: '#EFF6FF',
      border: '#3B82F6',
      tag: 'Promocao',
      tagBg: '#EFF6FF',
      tagText: '#1D4ED8',
      title: `${weakestDay} e seu dia mais fraco nos ultimos 3 meses`,
      desc: `Crie uma promocao ou pacote exclusivo para ${weakestDay.toLowerCase()} e aumente a ocupacao nesses horarios.`,
      action: 'Ver Agenda',
      href: '/app/agenda',
      whatsapp: `Oi [Nome]! Essa ${weakestDay.toLowerCase()} tem horarios especiais disponiveis. Que tal aproveitar? Me chama pra agendar!`,
    },
  ].filter(Boolean).slice(0, 3);

  // ── AI analysis ───────────────────────────────────────────────────
  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    setAiError(null);
    try {
      const inactiveList = customers
        .filter(c => c.last_appointment_at && Math.floor((now - new Date(c.last_appointment_at)) / 86400000) > 30)
        .slice(0, 10)
        .map(c => c.name);

      const topSvcs = Object.entries(serviceRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, rev]) => `${name}: R$${rev.toFixed(0)}`);

      const prompt = `Voce e um consultor de crescimento para barbearias brasileiras.
Dados reais da barbearia "${company?.name || 'cliente'}":
- Total de clientes: ${customers.length}
- Clientes inativos ha +30 dias: ${inactiveList.join(', ') || 'nenhum'}
- Top servicos por faturamento: ${topSvcs.join(', ') || 'sem dados ainda'}
- Profissionais ativos: ${professionals.map(p => p.name).join(', ') || 'sem dados'}
- Dias de funcionamento: ${openDayNames.join(', ') || 'nao informado'} (NUNCA sugira acoes para dias fechados)
- Dia mais fraco (entre os dias abertos): ${weakestDay || 'sem dados suficientes'}
- Profissional mais ocupado: ${busiestPro ? `${busiestPro[0]} (${busiestPct}% do movimento)` : 'sem dados'}

Gere EXATAMENTE 3 recomendacoes praticas e especificas para ESTA barbearia crescer agora.
Use linguagem direta, sem enrolacao. Nao use emojis.
Cada recomendacao deve ter:
- title: frase curta de impacto (max 60 chars) usando os dados reais
- desc: acao concreta de 1-2 linhas (max 120 chars)
- whatsapp: mensagem pronta para enviar no WhatsApp para clientes (sem emojis), ou null se nao aplicavel
- href: uma dessas rotas exatas: /app/clientes, /app/agenda, /app/servicos, /app/profissionais, /app/financeiro, /app/fidelizacao
- action: texto curto do botao (max 20 chars)`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            cards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title:    { type: 'string' },
                  desc:     { type: 'string' },
                  whatsapp: { type: ['string', 'null'] },
                  href:     { type: 'string' },
                  action:   { type: 'string' },
                },
              },
            },
          },
        },
      });

      if (!result?.cards?.length) throw new Error('Resposta vazia da IA');
      setAiCards(result.cards);
    } catch (e) {
      console.error('[AI Growth]', e);
      setAiError('Nao foi possivel gerar a analise. Verifique sua conexao e tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2500);
  };

  const cardsToShow = aiCards !== null ? aiCards : staticCards;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-bold text-[#1B1C1E]">Acoes Recomendadas Agora</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {aiCards ? 'Analise gerada pela IA com seus dados reais' : 'Baseadas nos dados da sua barbearia'}
          </p>
        </div>
        <button
          onClick={handleAIAnalysis}
          disabled={loadingAI}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          style={{ background: '#111111', color: '#F7F3EC' }}
        >
          {loadingAI
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Analisando...</>
            : <><Zap className="w-4 h-4" style={{ color: '#C89B3C' }} />Pedir nova analise a IA</>
          }
        </button>
      </div>

      {aiError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {aiError}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {cardsToShow.map((card, i) => {
          const aiStyle = AI_CARD_STYLES[i % AI_CARD_STYLES.length];
          const borderColor = card.border || (aiCards ? aiStyle.border : '#E8DED0');
          const tagBg = card.tagBg || aiStyle.tagBg;
          const tagText = card.tagText || aiStyle.tagText;

          return (
            <div
              key={card.id || i}
              className="bg-white rounded-2xl border-2 p-5 flex flex-col"
              style={{ borderColor }}
            >
              <div className="flex items-center gap-2 mb-3">
                {card.tag && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                    style={{ background: tagBg, color: tagText }}>
                    {card.tag}
                  </span>
                )}
                {aiCards && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-purple-100 text-purple-700">
                    IA
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[#1B1C1E] text-sm leading-snug mb-1.5">{card.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.desc}</p>

              <div className="mt-4 flex flex-col gap-2">
                {card.whatsapp && (
                  <button
                    onClick={() => handleCopy(`wa_${card.id || i}`, card.whatsapp)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all w-full justify-center"
                    style={copied === `wa_${card.id || i}`
                      ? { background: '#D1FAE5', color: '#065F46' }
                      : { background: '#F7F3EC', color: '#1B1C1E' }}
                  >
                    {copied === `wa_${card.id || i}`
                      ? <><CheckCircle className="w-3 h-3" />Copiado!</>
                      : <><MessageSquare className="w-3 h-3" />Copiar mensagem WA</>}
                  </button>
                )}
                {card.href && (
                  <a href={card.href}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg justify-center transition-all"
                    style={{ background: '#111111', color: '#F7F3EC' }}>
                    {card.action || 'Ver mais'} <ArrowRight className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {cardsToShow.length === 0 && (
          <div className="md:col-span-3 text-center py-10 text-sm text-gray-400">
            Registre mais atendimentos para receber recomendacoes personalizadas.
          </div>
        )}
      </div>
    </div>
  );
}
