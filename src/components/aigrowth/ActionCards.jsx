import { useState } from 'react';
import { Zap, RefreshCw, ArrowRight, Copy, CheckCircle, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ActionCards({ company, customers, appointments, services, professionals }) {
  const [aiCards, setAiCards] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [copied, setCopied] = useState(null);

  // ── Static derived cards ──────────────────────────────────────────
  const now = new Date();

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

  // Dia da semana mais fraco
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  appointments.filter(a => {
    const d = new Date(a.scheduled_at);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return d >= threeMonthsAgo;
  }).forEach(a => {
    const dow = new Date(a.scheduled_at).getDay();
    dayCounts[dow]++;
  });
  const weakestDayIdx = dayCounts.reduce((minI, v, i) => (v < dayCounts[minI] ? i : minI), 0);
  const weakestDay = dayNames[weakestDayIdx];

  // Serviço mais lucrativo — sugerir aumento de preço
  const serviceRevenue = {};
  appointments.filter(a => a.status === 'concluido' && a.service_name && a.price).forEach(a => {
    serviceRevenue[a.service_name] = (serviceRevenue[a.service_name] || 0) + a.price;
  });
  const topService = Object.entries(serviceRevenue).sort((a, b) => b[1] - a[1])[0];

  const staticCards = [
    inactiveCount > 0 && {
      id: 'inactive',
      color: '#FFF3E0',
      border: '#F5A623',
      tag: '🔴 Urgente',
      tagBg: '#FFF3E0',
      tagText: '#B45309',
      title: `Você tem ${inactiveCount} cliente${inactiveCount > 1 ? 's' : ''} sumido${inactiveCount > 1 ? 's' : ''} há mais de ${company?.retention_interval_days || 45} dias`,
      desc: 'Disparar campanha de retorno agora — cada cliente perdido custa 5x mais para recuperar.',
      action: 'Ir para Fidelização',
      href: '/app/fidelizacao',
      whatsapp: `Oi [Nome]! 😄 Já faz um tempinho que não te vemos por aqui. Temos horários disponíveis essa semana — bora agendar? ✂️`,
    },
    busiestPro && busiestPct >= 70 && {
      id: 'busy_pro',
      color: '#F0FDF4',
      border: '#22C55E',
      tag: '💰 Oportunidade',
      tagBg: '#F0FDF4',
      tagText: '#15803D',
      title: `${busiestPro[0]} está com ${busiestPct}% dos atendimentos do mês`,
      desc: `Alta demanda concentrada. Considere aumentar o preço dos serviços de ${busiestPro[0]} ou criar lista de espera.`,
      action: 'Ver Profissionais',
      href: '/app/profissionais',
      whatsapp: null,
    },
    {
      id: 'weak_day',
      color: '#EFF6FF',
      border: '#3B82F6',
      tag: '📅 Promoção',
      tagBg: '#EFF6FF',
      tagText: '#1D4ED8',
      title: `${weakestDay} é seu dia mais fraco nos últimos 3 meses`,
      desc: `Crie uma promoção ou pacote exclusivo para ${weakestDay.toLowerCase()} e aumente a ocupação nesses horários.`,
      action: 'Ver Agenda',
      href: '/app/agenda',
      whatsapp: `Oi [Nome]! Essa ${weakestDay.toLowerCase()} tem horários especiais disponíveis 🎉 Que tal aproveitar? Me chama pra agendar! ✂️`,
    },
  ].filter(Boolean).slice(0, 3);

  // ── AI-generated cards ────────────────────────────────────────────
  const handleAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const inactiveList = customers
        .filter(c => c.last_appointment_at && Math.floor((now - new Date(c.last_appointment_at)) / 86400000) > 30)
        .slice(0, 10)
        .map(c => c.name);

      const topSvcs = Object.entries(serviceRevenue)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, rev]) => `${name}: R$${rev.toFixed(0)}`);

      const prompt = `Você é um consultor de crescimento para barbearias.
Dados reais da barbearia "${company?.name || 'cliente'}":
- Total de clientes: ${customers.length}
- Clientes inativos há +30 dias: ${inactiveList.join(', ') || 'nenhum'}
- Top serviços por faturamento: ${topSvcs.join(', ') || 'sem dados'}
- Profissionais ativos: ${professionals.map(p => p.name).join(', ') || 'sem dados'}
- Dia mais fraco: ${weakestDay}
- Profissional mais ocupado: ${busiestPro ? `${busiestPro[0]} (${busiestPct}% do movimento)` : 'sem dados'}

Gere EXATAMENTE 3 recomendações práticas e específicas para ESTA barbearia crescer agora. Cada uma deve ter:
- title: frase curta de impacto (máx 60 chars) usando os dados reais
- desc: ação concreta de 1 linha (máx 100 chars)
- whatsapp: mensagem pronta para enviar no WhatsApp para clientes (quando aplicável, ou null)`;

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
                  title: { type: 'string' },
                  desc: { type: 'string' },
                  whatsapp: { type: ['string', 'null'] },
                },
              },
            },
          },
        },
      });
      setAiCards(result.cards || []);
    } catch (e) {
      console.error(e);
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
          <h2 className="font-bold text-[#1B1C1E]">Ações Recomendadas Agora</h2>
          <p className="text-xs text-gray-400 mt-0.5">{aiCards ? 'Análise gerada pela IA com seus dados reais' : 'Baseadas nos dados da sua barbearia'}</p>
        </div>
        <button
          onClick={handleAIAnalysis}
          disabled={loadingAI}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
          style={{ background: '#111111', color: '#F7F3EC' }}
        >
          {loadingAI
            ? <><RefreshCw className="w-4 h-4 animate-spin" />Analisando...</>
            : <><Zap className="w-4 h-4" style={{ color: '#C89B3C' }} />Pedir nova análise à IA</>
          }
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {cardsToShow.map((card, i) => (
          <div
            key={card.id || i}
            className="bg-white rounded-2xl border-2 p-5 flex flex-col"
            style={{ borderColor: card.border || '#E8DED0' }}
          >
            {card.tag && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg w-fit mb-3"
                style={{ background: card.tagBg || '#F7F3EC', color: card.tagText || '#6B6258' }}>
                {card.tag}
              </span>
            )}
            {aiCards && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg w-fit mb-3 bg-purple-100 text-purple-700">
                ✨ IA
              </span>
            )}
            <h3 className="font-bold text-[#1B1C1E] text-sm leading-snug mb-1.5">{card.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.desc}</p>

            <div className="mt-4 flex flex-col gap-2">
              {card.whatsapp && (
                <button
                  onClick={() => handleCopy(`wa_${card.id || i}`, card.whatsapp)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all w-full justify-center"
                  style={copied === `wa_${card.id || i}` ? { background: '#D1FAE5', color: '#065F46' } : { background: '#F7F3EC', color: '#1B1C1E' }}
                >
                  {copied === `wa_${card.id || i}` ? <><CheckCircle className="w-3 h-3" />Copiado!</> : <><MessageSquare className="w-3 h-3" />Copiar mensagem WA</>}
                </button>
              )}
              {card.href && (
                <a href={card.href}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg justify-center transition-all"
                  style={{ background: '#111111', color: '#F7F3EC' }}>
                  {card.action} <ArrowRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
        {cardsToShow.length === 0 && (
          <div className="md:col-span-3 text-center py-10 text-sm text-gray-400">
            Nenhuma recomendação disponível. Registre mais atendimentos para análises precisas.
          </div>
        )}
      </div>
    </div>
  );
}