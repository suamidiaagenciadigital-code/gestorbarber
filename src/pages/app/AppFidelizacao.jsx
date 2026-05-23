import AppLayout from '@/components/layout/AppLayout';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/hooks/useCompany';
import { useAuth } from '@/lib/AuthContext';
import { useState } from 'react';
import { Users, MessageSquare, TrendingUp, RefreshCw, CheckCircle, Clock, Ban, Send, ExternalLink } from 'lucide-react';
import { startOfMonth, endOfMonth, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

export default function AppFidelizacao() {
  const { companyId, company, isLoading: loadingCompany } = useCompany();
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const retentionDays = company?.retention_interval_days || 30;
  const now = new Date();
  const cutoffDate = subDays(now, retentionDays);
  const cooldownDate = subDays(now, 30);

  const { data: customers = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['customers_retention', companyId],
    queryFn: () => base44.entities.Customer.filter({ company_id: companyId }),
    enabled: !!companyId,
  });

  // Clientes contatados este mês
  const monthStart = startOfMonth(now);
  const contactedThisMonth = customers.filter(c =>
    c.last_retention_contact_at && new Date(c.last_retention_contact_at) >= monthStart
  );

  // Clientes recuperados este mês (agendamento após contato)
  const recoveredThisMonth = customers.filter(c =>
    c.retention_recovered_at && new Date(c.retention_recovered_at) >= monthStart
  );

  // Clientes inativos elegíveis (sem corte há X dias + fora do cooldown de 30d)
  const inactiveEligible = customers.filter(c => {
    if (c.no_marketing) return false;
    if (c.last_retention_contact_at && new Date(c.last_retention_contact_at) >= cooldownDate) return false;
    if (!c.last_appointment_at) return false;
    return new Date(c.last_appointment_at) < cutoffDate;
  });

  // Clientes em cooldown (já contatados, aguardando 30 dias)
  const inCooldown = customers.filter(c =>
    c.last_retention_contact_at && new Date(c.last_retention_contact_at) >= cooldownDate &&
    !c.retention_recovered_at
  );

  const companyBookingUrl = company?.slug
    ? `${window.location.origin}/agendar/${company.slug}`
    : null;

  function buildWaLink(customer) {
    const phone = (customer.phone || '').replace(/\D/g, '');
    if (phone.length < 10) return null;
    const daysSince = customer.last_appointment_at
      ? Math.floor((now - new Date(customer.last_appointment_at)) / (1000 * 60 * 60 * 24))
      : null;
    const companyName = company?.nome_fantasia || company?.name || 'Barbearia';
    const msg = `Oi, ${customer.name}! 👋 Faz ${daysSince} dias desde o seu último corte na ${companyName}. Sentimos sua falta! Que tal agendar um horário? ${companyBookingUrl ? `Reserve agora: ${companyBookingUrl}` : 'Entre em contato para agendar.'} 😊`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`;
  }

  // Marcar como "no_marketing"
  const toggleMktMutation = useMutation({
    mutationFn: ({ id, val }) => base44.entities.Customer.update(id, { no_marketing: val }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers_retention', companyId] }),
  });

  // Marcar recuperado manualmente
  const markRecoveredMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.update(id, { retention_recovered_at: now.toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers_retention', companyId] });
      toast({ title: 'Cliente marcado como recuperado!' });
    },
  });

  const loading = loadingCompany || loadingCustomers;
  const conversionRate = contactedThisMonth.length > 0
    ? Math.round((recoveredThisMonth.length / contactedThisMonth.length) * 100)
    : 0;

  if (loading) {
    return (
      <AppLayout>
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-[#C89B3C]/20 border-t-[#C89B3C] rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1B1C1E]">Fidelização & Retorno</h1>
          <p className="text-gray-500 text-sm mt-1">
            Clientes sem visita há +{retentionDays} dias são automaticamente notificados. Configure o intervalo em{' '}
            <a href="/app/configuracoes" className="text-[#C89B3C] underline">Configurações</a>.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Inativos elegíveis',
              value: inactiveEligible.length,
              icon: Users,
              color: '#C89B3C',
              sub: `Sem visita há +${retentionDays} dias`,
            },
            {
              label: 'Contatados este mês',
              value: contactedThisMonth.length,
              icon: MessageSquare,
              color: '#3D7A96',
              sub: format(monthStart, 'MMMM/yyyy', { locale: ptBR }),
            },
            {
              label: 'Recuperados este mês',
              value: recoveredThisMonth.length,
              icon: CheckCircle,
              color: '#16A34A',
              sub: 'Voltaram após contato',
            },
            {
              label: 'Taxa de conversão',
              value: `${conversionRate}%`,
              icon: TrendingUp,
              color: '#7C3AED',
              sub: 'Contatados → voltaram',
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-black/8 p-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${s.color}18` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black text-[#111111]">{s.value}</div>
              <div className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Inativos elegíveis */}
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[#1B1C1E]">
                Inativos elegíveis
                <span className="ml-2 text-xs font-normal text-gray-400">({inactiveEligible.length})</span>
              </h2>
              <span className="text-xs text-gray-400">Clique em WhatsApp para enviar</span>
            </div>

            {inactiveEligible.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CheckCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum cliente inativo elegível no momento</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {inactiveEligible.map(c => {
                  const daysSince = c.last_appointment_at
                    ? Math.floor((now - new Date(c.last_appointment_at)) / (1000 * 60 * 60 * 24))
                    : null;
                  const waLink = buildWaLink(c);
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#FFF9EE' }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#111111] truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          {daysSince ? `${daysSince} dias sem corte` : 'Nunca visitou'}
                          {c.phone && ` · ${c.phone}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {waLink ? (
                          <a href={waLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                            style={{ background: '#25D366' }}>
                            <Send className="w-3 h-3" />
                            WhatsApp
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">Sem contato</span>
                        )}
                        <button
                          onClick={() => toggleMktMutation.mutate({ id: c.id, val: true })}
                          title="Não enviar comunicações"
                          className="p-1.5 rounded-lg hover:bg-red-100 transition-colors">
                          <Ban className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contatados recentemente */}
          <div className="bg-white rounded-2xl border border-black/8 p-6">
            <h2 className="font-bold text-[#1B1C1E] mb-4">
              Em acompanhamento
              <span className="ml-2 text-xs font-normal text-gray-400">({inCooldown.length} em cooldown)</span>
            </h2>

            {inCooldown.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Nenhum cliente aguardando retorno</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {inCooldown.map(c => {
                  const daysAgo = c.last_retention_contact_at
                    ? Math.floor((now - new Date(c.last_retention_contact_at)) / (1000 * 60 * 60 * 24))
                    : null;
                  return (
                    <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F0F9FF' }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-[#111111] truncate">{c.name}</div>
                        <div className="text-xs text-gray-500">
                          Contatado há {daysAgo} dias
                          {c.phone && ` · ${c.phone}`}
                        </div>
                      </div>
                      <button
                        onClick={() => markRecoveredMutation.mutate(c.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                        style={{ background: '#16A34A' }}>
                        <CheckCircle className="w-3 h-3" />
                        Recuperado
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bloqueados de comunicação */}
            <div className="mt-4 pt-4 border-t border-black/5">
              <div className="text-xs font-semibold text-gray-400 mb-2">
                Sem comunicações ({customers.filter(c => c.no_marketing).length} clientes)
              </div>
              {customers.filter(c => c.no_marketing).slice(0, 3).map(c => (
                <div key={c.id} className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">{c.name}</span>
                  <button
                    onClick={() => toggleMktMutation.mutate({ id: c.id, val: false })}
                    className="text-xs text-[#C89B3C] hover:underline">
                    Reativar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Histórico do mês */}
        <div className="mt-6 bg-white rounded-2xl border border-black/8 p-6">
          <h2 className="font-bold text-[#1B1C1E] mb-4">Histórico de recuperação — {format(now, 'MMMM/yyyy', { locale: ptBR })}</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-[#FFF9EE] rounded-xl p-4">
              <div className="text-2xl font-black text-[#C89B3C]">{contactedThisMonth.length}</div>
              <div className="text-xs text-gray-500 mt-1">Contatados no mês</div>
            </div>
            <div className="bg-[#F0FFF4] rounded-xl p-4">
              <div className="text-2xl font-black text-green-600">{recoveredThisMonth.length}</div>
              <div className="text-xs text-gray-500 mt-1">Recuperados no mês</div>
            </div>
            <div className="bg-[#F5F3FF] rounded-xl p-4">
              <div className="text-2xl font-black text-purple-600">{conversionRate}%</div>
              <div className="text-xs text-gray-500 mt-1">Taxa de conversão</div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}