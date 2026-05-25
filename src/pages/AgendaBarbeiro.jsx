import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scissors, Calendar, Clock, AlertCircle } from 'lucide-react';

const STATUS_STYLE = {
  agendado:   { label: 'Agendado',   cls: 'bg-blue-100 text-blue-700' },
  confirmado: { label: 'Confirmado', cls: 'bg-green-100 text-green-700' },
  concluido:  { label: 'Concluido',  cls: 'bg-gray-100 text-gray-500' },
  cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-500' },
  faltou:     { label: 'Faltou',     cls: 'bg-orange-100 text-orange-600' },
};

function firstAndLastInitial(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

export default function AgendaBarbeiro() {
  const { slug, proId } = useParams();
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));

  const { data: companies = [], isLoading: loadingCompany } = useQuery({
    queryKey: ['company-by-slug', slug],
    queryFn: () => base44.entities.Company.filter({ slug }),
    enabled: !!slug,
  });
  const company = companies[0];

  const { data: professionals = [], isLoading: loadingPro } = useQuery({
    queryKey: ['public-professionals', company?.id],
    queryFn: () => base44.entities.Professional.filter({ company_id: company.id }),
    enabled: !!company?.id,
  });
  const pro = professionals.find(p => p.id === proId);

  const { data: appointments = [], isLoading: loadingAppts } = useQuery({
    queryKey: ['barbeiro-agenda', company?.id, proId],
    queryFn: () => base44.entities.Appointment.filter({ company_id: company.id, professional_id: proId }),
    enabled: !!company?.id && !!proId,
    refetchInterval: 60_000,
  });

  const isLoading = loadingCompany || loadingPro || loadingAppts;
  const primaryColor = company?.primary_color || '#1B3A4B';

  // 7 dias a partir de hoje
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  const dayAppts = appointments
    .filter(a => {
      if (['cancelado', 'faltou'].includes(a.status)) return false;
      return isSameDay(new Date(a.scheduled_at), selectedDay);
    })
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const todayTotal = appointments.filter(a =>
    !['cancelado', 'faltou'].includes(a.status) &&
    isSameDay(new Date(a.scheduled_at), startOfDay(new Date()))
  ).length;

  if (!slug || (!isLoading && !company)) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Barbearia nao encontrada</p>
        </div>
      </div>
    );
  }

  if (!isLoading && !pro) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Profissional nao encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7F3] font-inter flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/10 px-5 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor }}>
            {pro?.photo_url
              ? <img src={pro.photo_url} alt={pro.name} className="w-9 h-9 rounded-xl object-cover" />
              : <Scissors className="w-4 h-4 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-[#1B1C1E] truncate">
              {isLoading ? '...' : pro?.name}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {isLoading ? '' : `${company?.nome_fantasia || company?.name} · ${pro?.specialty || 'Barbeiro'}`}
            </div>
          </div>
          {!isLoading && (
            <div className="text-right flex-shrink-0">
              <div className="text-xl font-black text-[#1B1C1E]">{todayTotal}</div>
              <div className="text-[10px] text-gray-400">hoje</div>
            </div>
          )}
        </div>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#E8DED0] border-t-[#1B3A4B] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 max-w-lg mx-auto w-full px-4 py-5">

          {/* Seletor de dias */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {days.map((day, i) => {
              const isSelected = isSameDay(day, selectedDay);
              const count = appointments.filter(a =>
                !['cancelado', 'faltou'].includes(a.status) &&
                isSameDay(new Date(a.scheduled_at), day)
              ).length;
              return (
                <button key={i}
                  onClick={() => setSelectedDay(day)}
                  className="flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl border transition-all min-w-[58px]"
                  style={{
                    backgroundColor: isSelected ? primaryColor : 'white',
                    borderColor: isSelected ? primaryColor : 'rgba(0,0,0,0.08)',
                    color: isSelected ? 'white' : '#6B6258',
                  }}>
                  <span className="text-[10px] uppercase tracking-wide opacity-70">
                    {i === 0 ? 'Hoje' : format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-black leading-tight">{format(day, 'd')}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-bold mt-0.5 opacity-80">{count} atend.</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Título do dia */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1B1C1E]">
              {isSameDay(selectedDay, startOfDay(new Date()))
                ? 'Hoje'
                : format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </h2>
            <span className="text-xs text-gray-400">{dayAppts.length} agendamento{dayAppts.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Lista de agendamentos */}
          {dayAppts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/8 p-10 text-center">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Nenhum agendamento neste dia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayAppts.map(a => {
                const st = STATUS_STYLE[a.status] || STATUS_STYLE.agendado;
                const hora = format(new Date(a.scheduled_at), 'HH:mm');
                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-black/8 p-4 flex items-center gap-4">
                    {/* Horário */}
                    <div className="flex-shrink-0 text-center w-14">
                      <div className="text-lg font-black text-[#1B1C1E]">{hora}</div>
                      <div className="flex items-center justify-center gap-0.5 text-[10px] text-gray-400">
                        <Clock className="w-2.5 h-2.5" />
                        {a.duration_minutes || '—'}min
                      </div>
                    </div>
                    {/* Divisor */}
                    <div className="w-px h-10 bg-black/8 flex-shrink-0" />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#1B1C1E] truncate">
                        {a.service_name || 'Servico'}
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">
                        {firstAndLastInitial(a.customer_name || 'Cliente')}
                        {a.notes ? ` · ${a.notes}` : ''}
                      </div>
                    </div>
                    {/* Status */}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0 ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <footer className="py-4 text-center">
        <p className="text-xs text-gray-400">
          Agenda de <span className="font-semibold">{pro?.name}</span> · {company?.nome_fantasia || company?.name}
        </p>
      </footer>
    </div>
  );
}
