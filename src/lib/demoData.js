// Static demo data used by /demo/* pages (no auth required)

export const demoProfessionals = [
  { id: 'p1', name: 'Carlos Silva', specialty: 'Corte & Barba', active: true, photo_url: null },
  { id: 'p2', name: 'Rafael Costa', specialty: 'Degradê & Navalhado', active: true, photo_url: null },
  { id: 'p3', name: 'Lucas Mendes', specialty: 'Coloração & Progressiva', active: true, photo_url: null },
];

export const demoServices = [
  { id: 's1', name: 'Corte Clássico', price: 45, duration_minutes: 30, active: true },
  { id: 's2', name: 'Corte + Barba', price: 70, duration_minutes: 50, active: true },
  { id: 's3', name: 'Barba Completa', price: 35, duration_minutes: 30, active: true },
  { id: 's4', name: 'Degradê', price: 55, duration_minutes: 40, active: true },
  { id: 's5', name: 'Navalhado', price: 65, duration_minutes: 45, active: true },
  { id: 's6', name: 'Coloração', price: 120, duration_minutes: 90, active: true },
];

const now = new Date();
const d = (offsetDays, h, m) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offsetDays);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

export const demoAppointments = [
  { id: 'a1', customer_name: 'João Pedro', service_name: 'Corte Clássico', professional_name: 'Carlos Silva', scheduled_at: d(0, 9, 0),  status: 'concluido',  price: 45, source: 'online' },
  { id: 'a2', customer_name: 'Marcos Vinícius', service_name: 'Corte + Barba', professional_name: 'Rafael Costa', scheduled_at: d(0, 10, 0), status: 'concluido', price: 70, source: 'interno' },
  { id: 'a3', customer_name: 'Felipe Andrade', service_name: 'Degradê', professional_name: 'Lucas Mendes', scheduled_at: d(0, 11, 0), status: 'confirmado', price: 55, source: 'online' },
  { id: 'a4', customer_name: 'Bruno Henrique', service_name: 'Barba Completa', professional_name: 'Carlos Silva', scheduled_at: d(0, 14, 0), status: 'agendado',  price: 35, source: 'online' },
  { id: 'a5', customer_name: 'Rodrigo Lima', service_name: 'Corte Clássico', professional_name: 'Rafael Costa', scheduled_at: d(0, 15, 30), status: 'agendado', price: 45, source: 'interno' },
  { id: 'a6', customer_name: 'Gabriel Santos', service_name: 'Navalhado', professional_name: 'Lucas Mendes', scheduled_at: d(1, 9, 0),  status: 'agendado',  price: 65, source: 'online' },
  { id: 'a7', customer_name: 'André Oliveira', service_name: 'Corte + Barba', professional_name: 'Carlos Silva', scheduled_at: d(1, 10, 30), status: 'agendado', price: 70, source: 'online' },
  { id: 'a8', customer_name: 'Tiago Ferreira', service_name: 'Degradê', professional_name: 'Rafael Costa', scheduled_at: d(-1, 16, 0), status: 'cancelado',  price: 55, source: 'online' },
  { id: 'a9', customer_name: 'Pedro Alves', service_name: 'Coloração', professional_name: 'Lucas Mendes', scheduled_at: d(-2, 14, 0), status: 'concluido',  price: 120, source: 'interno' },
  { id: 'a10', customer_name: 'Mateus Souza', service_name: 'Barba Completa', professional_name: 'Carlos Silva', scheduled_at: d(-3, 11, 0), status: 'concluido', price: 35, source: 'online' },
  // extra for charts
  ...Array.from({ length: 20 }, (_, i) => ({
    id: `ax${i}`, customer_name: `Cliente ${i + 1}`, service_name: demoServices[i % demoServices.length].name,
    professional_name: demoProfessionals[i % 3].name,
    scheduled_at: d(-Math.floor(Math.random() * 30) - 1, 9 + (i % 8), 0),
    status: ['concluido', 'concluido', 'concluido', 'cancelado', 'faltou'][i % 5],
    price: demoServices[i % demoServices.length].price,
    source: i % 2 === 0 ? 'online' : 'interno',
  })),
];

export const demoCustomers = [
  { id: 'c1', name: 'João Pedro Almeida', phone: '(62) 9 9999-0001', email: 'joao@example.com', status: 'vip',    total_appointments: 24, last_appointment_at: d(-5, 10, 0), tags: ['VIP', 'Fiel'] },
  { id: 'c2', name: 'Marcos Vinícius',    phone: '(62) 9 9999-0002', email: null,               status: 'active', total_appointments: 12, last_appointment_at: d(-3, 11, 0), tags: [] },
  { id: 'c3', name: 'Felipe Andrade',     phone: '(62) 9 9999-0003', email: null,               status: 'active', total_appointments: 8,  last_appointment_at: d(-7, 9, 0),  tags: [] },
  { id: 'c4', name: 'Bruno Henrique',     phone: '(62) 9 9999-0004', email: 'bruno@example.com',status: 'inactive',total_appointments: 3, last_appointment_at: d(-45, 14, 0), tags: ['Inativo'] },
  { id: 'c5', name: 'Rodrigo Lima',       phone: '(62) 9 9999-0005', email: null,               status: 'active', total_appointments: 6,  last_appointment_at: d(-2, 15, 0), tags: [] },
  { id: 'c6', name: 'Gabriel Santos',     phone: '(62) 9 9999-0006', email: 'gabriel@example.com', status: 'vip', total_appointments: 31, last_appointment_at: d(-1, 9, 0),  tags: ['VIP'] },
  { id: 'c7', name: 'André Oliveira',     phone: '(62) 9 9999-0007', email: null,               status: 'inactive',total_appointments: 2, last_appointment_at: d(-60, 10, 0), tags: ['Inativo'] },
  { id: 'c8', name: 'Tiago Ferreira',     phone: '(62) 9 9999-0008', email: null,               status: 'active', total_appointments: 9,  last_appointment_at: d(-10, 16, 0), tags: [] },
  { id: 'c9', name: 'Pedro Alves',        phone: '(62) 9 9999-0009', email: null,               status: 'active', total_appointments: 15, last_appointment_at: d(-4, 14, 0),  tags: [] },
  { id: 'c10', name: 'Mateus Souza',      phone: '(62) 9 9999-0010', email: 'mateus@example.com',status: 'vip',  total_appointments: 42, last_appointment_at: d(-3, 11, 0),  tags: ['VIP', 'Fiel'] },
];

export const demoFinancial = [
  { id: 'f1', type: 'entrada', category: 'Atendimento', description: 'Corte Clássico — João Pedro',  amount: 45,  date: d(0, 9, 0).split('T')[0],  status: 'confirmado' },
  { id: 'f2', type: 'entrada', category: 'Atendimento', description: 'Corte + Barba — Marcos V.',    amount: 70,  date: d(0, 10, 0).split('T')[0], status: 'confirmado' },
  { id: 'f3', type: 'saida',   category: 'Produtos',    description: 'Compra pomadas e shampoo',     amount: 180, date: d(-1, 8, 0).split('T')[0], status: 'confirmado' },
  { id: 'f4', type: 'entrada', category: 'Atendimento', description: 'Coloração — Pedro Alves',      amount: 120, date: d(-2, 14, 0).split('T')[0], status: 'confirmado' },
  { id: 'f5', type: 'saida',   category: 'Fixo',        description: 'Aluguel do espaço',            amount: 1200,date: d(-5, 8, 0).split('T')[0], status: 'confirmado' },
  { id: 'f6', type: 'entrada', category: 'Atendimento', description: 'Barba Completa — Mateus S.',   amount: 35,  date: d(-3, 11, 0).split('T')[0], status: 'confirmado' },
  { id: 'f7', type: 'entrada', category: 'Atendimento', description: 'Degradê — Felipe A.',          amount: 55,  date: d(-1, 15, 0).split('T')[0], status: 'confirmado' },
  { id: 'f8', type: 'saida',   category: 'Marketing',   description: 'Impulsionamento Instagram',    amount: 150, date: d(-7, 8, 0).split('T')[0], status: 'confirmado' },
];

export const demoAIInsights = {
  inactiveCount: 2,
  busiestPro: { name: 'Carlos Silva', pct: 48 },
  weakestDay: 'Segunda',
  cards: [
    {
      id: 'inactive', tag: '🔴 Urgente', tagBg: '#FFF3E0', tagText: '#B45309', border: '#F5A623',
      title: 'Você tem 2 clientes sumidos há mais de 30 dias',
      desc: 'Disparar campanha de retorno agora — cada cliente perdido custa 5x mais para recuperar.',
      action: 'Ir para Fidelização', href: '/demo/clientes',
      whatsapp: 'Oi [Nome]! 😄 Já faz um tempinho que não te vemos por aqui. Temos horários disponíveis essa semana — bora agendar? ✂️',
    },
    {
      id: 'weak_day', tag: '📅 Promoção', tagBg: '#EFF6FF', tagText: '#1D4ED8', border: '#3B82F6',
      title: 'Segunda é o seu dia mais fraco nos últimos 3 meses',
      desc: 'Crie um pacote exclusivo para segunda-feira e aumente a ocupação nesses horários.',
      action: 'Ver Agenda', href: '/demo/agenda',
      whatsapp: 'Oi [Nome]! Essa segunda tem horários especiais disponíveis 🎉 Que tal aproveitar? Me chama pra agendar! ✂️',
    },
    {
      id: 'busy_pro', tag: '💰 Oportunidade', tagBg: '#F0FDF4', tagText: '#15803D', border: '#22C55E',
      title: 'Carlos Silva está com 48% dos atendimentos do mês',
      desc: 'Alta demanda concentrada. Considere aumentar o preço dos serviços de Carlos ou criar lista de espera.',
      action: 'Ver Profissionais', href: '/demo/profissionais',
      whatsapp: null,
    },
  ],
};
