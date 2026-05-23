/**
 * retention-scheduler
 * Scheduled daily — finds inactive customers per company and sends WhatsApp/email retention messages.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function buildRetentionMessage(customerName: string, days: number, companyName: string, bookingSlug?: string): string {
  const bookingUrl = bookingSlug ? `https://gestorbarber.com.br/agendar/${bookingSlug}` : '';
  return `Oi, ${customerName}! 👋 Faz ${days} dias desde o seu último corte na ${companyName}. Sentimos sua falta! Que tal agendar um horário? ${bookingUrl ? `Reserve agora: ${bookingUrl}` : 'Entre em contato para agendar.'} 😊`;
}

async function sendEmail(to: string, subject: string, body: string, fromName?: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${fromName || 'Gestor Barber'} <noreply@gestorbarber.com.br>`,
        to, subject, html: body,
      }),
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

  const now = new Date();
  const results = { processed: 0, skipped: 0, notified: 0, errors: 0, details: [] as any[] };

  const { data: companies = [] } = await supabase.from('companies').select('*').eq('status', 'active');

  for (const company of companies) {
    const retentionDays = company.retention_interval_days || 30;
    const companyName = company.nome_fantasia || company.name || 'Barbearia';
    const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
    const contactCooldown = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: customers = [] } = await supabase.from('customers').select('*').eq('company_id', company.id);

    for (const customer of customers) {
      results.processed++;

      if (customer.no_marketing) {
        results.skipped++;
        results.details.push({ customer_id: customer.id, reason: 'no_marketing' });
        continue;
      }
      if (customer.last_retention_contact_at && new Date(customer.last_retention_contact_at) >= contactCooldown) {
        results.skipped++;
        results.details.push({ customer_id: customer.id, reason: 'cooldown_30d' });
        continue;
      }

      let lastCutDate: Date | null = customer.last_appointment_at ? new Date(customer.last_appointment_at) : null;
      if (!lastCutDate) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('scheduled_at')
          .eq('company_id', company.id)
          .eq('customer_id', customer.id)
          .eq('status', 'concluido')
          .order('scheduled_at', { ascending: false })
          .limit(1);
        if (appts?.length) lastCutDate = new Date(appts[0].scheduled_at);
      }

      if (!lastCutDate) {
        results.skipped++; results.details.push({ customer_id: customer.id, reason: 'no_completed_appointment' }); continue;
      }
      if (lastCutDate >= cutoffDate) {
        results.skipped++; results.details.push({ customer_id: customer.id, reason: 'still_active' }); continue;
      }

      const days = daysSince(lastCutDate.toISOString());
      const message = buildRetentionMessage(customer.name, days, companyName, company.slug);
      let sent = false;

      if (customer.phone && customer.phone.replace(/\D/g, '').length >= 10) {
        const phone = customer.phone.replace(/\D/g, '');
        results.details.push({
          customer_id: customer.id, customer_name: customer.name, company_id: company.id,
          channel: 'whatsapp', wa_url: `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`,
          days_since_last_cut: days,
        });
        sent = true;
      } else if (customer.email) {
        const ok = await sendEmail(customer.email, `${companyName} está com saudade de você!`, message, companyName);
        if (ok) { sent = true; }
        else { results.errors++; results.details.push({ customer_id: customer.id, error: 'email_failed' }); continue; }
      } else {
        results.skipped++; results.details.push({ customer_id: customer.id, reason: 'no_contact_info' }); continue;
      }

      if (sent) {
        await supabase.from('customers').update({
          last_retention_contact_at: now.toISOString(),
          retention_contact_count: (customer.retention_contact_count || 0) + 1,
        }).eq('id', customer.id);
        results.notified++;
      }
    }
  }

  return Response.json(
    { ok: true, run_at: now.toISOString(), companies_processed: companies.length, ...results },
    { headers: corsHeaders },
  );
});
