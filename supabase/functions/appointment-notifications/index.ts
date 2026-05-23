import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo',
  });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  });
}

function buildAddress(company: Record<string, any>): string {
  const e = company.endereco;
  if (!e) return company.address || '';
  return [e.rua, e.numero, e.complemento, e.bairro, e.cidade, e.uf].filter(Boolean).join(', ');
}

function buildWALink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const number = clean.startsWith('55') ? clean : `55${clean}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

function buildMessage(type: string, appt: Record<string, any>, company: Record<string, any>): string {
  const cliente = appt.customer_name || 'Cliente';
  const barbearia = company.nome_fantasia || company.name || 'Barbearia';
  const servico = appt.service_name || 'Serviço';
  const profissional = appt.professional_name || 'Profissional';
  const data = formatDate(appt.scheduled_at);
  const hora = formatTime(appt.scheduled_at);
  const endereco = buildAddress(company);
  const waBarb = company.whatsapp || company.telefone_comercial || '';
  const reagendarLink = waBarb ? buildWALink(waBarb, `Ola, preciso remarcar meu horario de ${hora}.`) : '';

  if (type === 'confirmacao') {
    return `Ola, ${cliente}. Seu horario em ${barbearia} esta confirmado: ${servico} com ${profissional} em ${data} as ${hora}.${endereco ? ` Endereco: ${endereco}.` : ''}`;
  }
  if (type === 'lembrete_24h') {
    return `Oi ${cliente}, lembrando do seu horario amanha em ${barbearia}, ${hora} com ${profissional}. Precisa remarcar? ${reagendarLink || 'Entre em contato conosco.'}`;
  }
  if (type === 'lembrete_2h') {
    return `Te esperamos em 2h, ${cliente}. ${barbearia}.`;
  }
  return '';
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Gestor Barber <noreply@gestorbarber.com.br>', to, subject, html: body }),
    });
    return res.ok;
  } catch { return false; }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let body: Record<string, any>;
  try { body = await req.json(); } catch {
    return Response.json({ error: 'Payload JSON inválido' }, { status: 400, headers: corsHeaders });
  }

  let appointment_id = body.appointment_id;
  let notification_type = body.notification_type || 'confirmacao';
  if (!appointment_id && body.event?.entity_id) appointment_id = body.event.entity_id;
  if (!appointment_id) {
    return Response.json({ error: 'appointment_id obrigatório' }, { status: 400, headers: corsHeaders });
  }

  const { data: appts } = await supabase.from('appointments').select('*').eq('id', appointment_id).limit(1);
  const appt = appts?.[0];
  if (!appt) return Response.json({ skipped: true, reason: `Appointment ${appointment_id} não encontrado.` }, { headers: corsHeaders });
  if (['cancelado', 'concluido', 'faltou'].includes(appt.status)) {
    return Response.json({ skipped: true, reason: `Status ${appt.status}, notificação ignorada.` }, { headers: corsHeaders });
  }

  const { data: companies } = await supabase.from('companies').select('*').eq('id', appt.company_id).limit(1);
  const company = companies?.[0];
  if (!company) return Response.json({ error: 'Company não encontrada' }, { status: 404, headers: corsHeaders });

  const message = buildMessage(notification_type, appt, company);
  if (!message) return Response.json({ error: 'Tipo de notificação inválido' }, { status: 400, headers: corsHeaders });

  let channel = 'email', success = false, details = '';
  const customerPhone = appt.customer_phone;
  const hasPhone = customerPhone && customerPhone.replace(/\D/g, '').length >= 10;

  if (hasPhone) {
    channel = 'whatsapp';
    details = `WhatsApp link: ${buildWALink(customerPhone, message)}`;
    success = true;
  }

  let emailSent = false;
  if (appt.customer_id) {
    const { data: customers } = await supabase.from('customers').select('email').eq('id', appt.customer_id).limit(1);
    const customerEmail = customers?.[0]?.email;
    if (customerEmail) {
      const barbearia = company.nome_fantasia || company.name || 'Barbearia';
      const subjectMap: Record<string, string> = {
        confirmacao: `Agendamento confirmado - ${barbearia}`,
        lembrete_24h: `Lembrete: seu horário amanhã - ${barbearia}`,
        lembrete_2h: `Seu horário é em 2 horas - ${barbearia}`,
      };
      emailSent = await sendEmail(customerEmail, subjectMap[notification_type] || `Notificação - ${barbearia}`, message);
      if (!hasPhone) { channel = 'email'; success = true; details = `E-mail enviado para ${customerEmail}`; }
    }
  }

  if (!hasPhone && !emailSent) {
    return Response.json({ skipped: true, reason: 'Sem telefone nem e-mail disponível.' }, { headers: corsHeaders });
  }

  const currentLog = Array.isArray(appt.notification_log) ? appt.notification_log : [];
  await supabase.from('appointments').update({
    notification_log: [...currentLog, { type: notification_type, channel, sent_at: new Date().toISOString(), success }],
  }).eq('id', appt.id);

  return Response.json(
    { ok: true, appointment_id: appt.id, notification_type, channel, email_sent: emailSent, details, message_preview: message },
    { headers: corsHeaders },
  );
});
