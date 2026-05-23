import { useMemo } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';
import { Scissors } from 'lucide-react';

export default function TopServices({ appointments }) {
  const top = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    const map = {};
    appointments
      .filter(a => a.status === 'concluido' && a.service_name && new Date(a.scheduled_at) >= start && new Date(a.scheduled_at) <= end)
      .forEach(a => {
        if (!map[a.service_name]) map[a.service_name] = { count: 0, revenue: 0 };
        map[a.service_name].count += 1;
        map[a.service_name].revenue += a.price || 0;
      });
    return Object.entries(map)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5);
  }, [appointments]);

  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <h2 className="font-bold text-[#1B1C1E] mb-1">Top 5 Serviços do Mês</h2>
      <p className="text-xs text-gray-400 mb-5">Ordenados por faturamento gerado</p>
      {top.length > 0 ? (
        <div className="space-y-3">
          {top.map(([name, data], i) => {
            const maxRev = top[0][1].revenue || 1;
            const pct = Math.round((data.revenue / maxRev) * 100);
            return (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                    <span className="text-sm font-semibold text-[#1B1C1E] truncate max-w-[160px]">{name}</span>
                    <span className="text-xs text-gray-400">{data.count}x</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: '#C89B3C' }}>
                    R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? '#C89B3C' : '#D4B57E' }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-24 text-sm text-gray-400">
          <Scissors className="w-4 h-4 mr-2 opacity-40" />
          Nenhum serviço concluído este mês.
        </div>
      )}
    </div>
  );
}