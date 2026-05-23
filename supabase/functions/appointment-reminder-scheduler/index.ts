/**
 * appointment-reminder-scheduler
 * Scheduled via Supabase cron (pg_cron or external cron job hitting this URL).
 * Runs hourly — checks appointments in the next 26 hours and sends reminders.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 26 * 60 * 60 * 1000);

  // Fetch all active appointments
  const { data: allActive = [] } = await supabase
    .from('appointments')
    .select('*')
    .in('status', ['agendado', 'confirmado'])
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', windowEnd.toISOString());

  const results: Record<string, string[]> = { lembrete_24h: [], lembrete_2h: [], skipped: [] };
  const notifUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/appointment-notifications`;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  for (const appt of allActive) {
    if (!appt.scheduled_at) continue;
    const scheduledAt = new Date(appt.scheduled_at);
    const diffMinutes = (scheduledAt.getTime() - now.getTime()) / (1000 * 60);
    const log = Array.isArray(appt.notification_log) ? appt.notification_log : [];
    const alreadySent = (type: string) => log.some((e: any) => e.type === type && e.success);

    if (diffMinutes >= 23 * 60 + 45 && diffMinutes <= 24 * 60 + 15) {
      if (!alreadySent('lembrete_24h')) {
        await fetch(notifUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: appt.id, notification_type: 'lembrete_24h' }),
        });
        results.lembrete_24h.push(appt.id);
      } else {
        results.skipped.push(appt.id);
      }
    }

    if (diffMinutes >= 105 && diffMinutes <= 135) {
      if (!alreadySent('lembrete_2h')) {
        await fetch(notifUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointment_id: appt.id, notification_type: 'lembrete_2h' }),
        });
        results.lembrete_2h.push(appt.id);
      } else {
        results.skipped.push(appt.id);
      }
    }
  }

  return Response.json(
    { ok: true, ran_at: now.toISOString(), processed: allActive.length, ...results },
    { headers: corsHeaders },
  );
});
