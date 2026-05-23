import { useMemo } from 'react';
import { differenceInDays } from 'date-fns';
import { Star, Crown } from 'lucide-react';

export default function VIPCustomers({ customers, appointments }) {
  const vips = useMemo(() => {
    const revenueByCustomer = {};
    appointments.filter(a => a.status === 'concluido').forEach(a => {
      if (!a.customer_id) return;
      if (!revenueByCustomer[a.customer_id]) revenueByCustomer[a.customer_id] = 0;
      revenueByCustomer[a.customer_id] += a.price || 0;
    });
    return customers
      .filter(c => c.total_appointments > 0)
      .map(c => ({
        ...c,
        lifetime_revenue: revenueByCustomer[c.id] || 0,
        daysSince: c.last_appointment_at ? differenceInDays(new Date(), new Date(c.last_appointment_at)) : null,
      }))
      .sort((a, b) => (b.total_appointments + b.lifetime_revenue / 100) - (a.total_appointments + a.lifetime_revenue / 100))
      .slice(0, 5);
  }, [customers, appointments]);

  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Crown className="w-4 h-4" style={{ color: '#C89B3C' }} />
        <h2 className="font-bold text-[#1B1C1E]">Clientes VIP</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">Mais frequentes e maior ticket — priorize a retenção deles</p>
      {vips.length > 0 ? (
        <div className="space-y-3">
          {vips.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#F7F3EC' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: i === 0 ? '#C89B3C' : '#E8DED0', color: i === 0 ? '#111' : '#6B6258' }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-[#1B1C1E] truncate">{c.name}</span>
                  {c.status === 'vip' && <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                </div>
                <div className="text-xs text-gray-400">
                  {c.total_appointments} visita{c.total_appointments !== 1 ? 's' : ''}
                  {c.daysSince !== null && (
                    <span className={c.daysSince > 30 ? ' text-red-500 font-semibold' : ''}>
                      {' '}· última há {c.daysSince}d
                    </span>
                  )}
                </div>
              </div>
              {c.lifetime_revenue > 0 && (
                <span className="text-xs font-bold flex-shrink-0" style={{ color: '#C89B3C' }}>
                  R${c.lifetime_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400">
          Cadastre clientes e registre agendamentos para ver o ranking VIP.
        </div>
      )}
    </div>
  );
}