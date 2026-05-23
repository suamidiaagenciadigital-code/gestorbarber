import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RevenueChart({ appointments }) {
  const data = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const month = subMonths(now, 5 - i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const revenue = appointments
        .filter(a => a.status === 'concluido' && a.price && new Date(a.scheduled_at) >= start && new Date(a.scheduled_at) <= end)
        .reduce((sum, a) => sum + a.price, 0);
      return {
        label: format(month, 'MMM', { locale: ptBR }),
        faturamento: revenue,
      };
    });
  }, [appointments]);

  const hasData = data.some(d => d.faturamento > 0);

  return (
    <div className="bg-white rounded-2xl border border-black/8 p-6">
      <h2 className="font-bold text-[#1B1C1E] mb-1">Evolução do Faturamento</h2>
      <p className="text-xs text-gray-400 mb-5">Últimos 6 meses — agendamentos concluídos com preço registrado</p>
      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EDE8" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6B6258' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v => `R$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} tick={{ fontSize: 11, fill: '#6B6258' }} axisLine={false} tickLine={false} width={56} />
            <Tooltip
              formatter={(v) => [`R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento']}
              contentStyle={{ borderRadius: 12, border: '1px solid #E8DED0', fontSize: 13 }}
            />
            <Bar dataKey="faturamento" fill="#C89B3C" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">
          Nenhum agendamento concluído com preço registrado nos últimos 6 meses.
        </div>
      )}
    </div>
  );
}