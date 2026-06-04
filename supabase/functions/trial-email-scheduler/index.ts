import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Gestor Barber <noreply@gestorbarber.ia.br>', to, subject, html }),
  });
}

function warningEmail(company: Record<string, string>, daysLeft: number, origin: string) {
  const urgentText = daysLeft === 1 ? 'último dia!' : `${daysLeft} dias restantes`;
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
    <h2 style="color:#1B1C1E">⏰ Seu trial termina em ${urgentText}</h2>
    <p>Olá, <strong>${company.name}</strong>!</p>
    <p>Seu período de teste no <strong>Gestor Barber</strong> está chegando ao fim. Para continuar usando sem interrupção, escolha um plano agora.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${origin}/app/dashboard" style="background:#C89B3C;color:#111;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px">
        Ver planos e assinar
      </a>
    </div>
    <p style="color:#666;font-size:13px">Planos a partir de R$ 59/mês. Cancele quando quiser.</p>
    <p style="color:#999;font-size:12px">Precisa de ajuda? <a href="https://wa.me/5562998801004" style="color:#1B3A4B">Fale conosco no WhatsApp</a></p>
  </div>`;
}

function expiredEmail(company: Record<string, string>, origin: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
    <h2 style="color:#DC2626">🔒 Seu trial encerrou</h2>
    <p>Olá, <strong>${company.name}</strong>!</p>
    <p>Seu período gratuito no <strong>Gestor Barber</strong> chegou ao fim. Seus dados estão seguros — escolha um plano para recuperar o acesso completo.</p>
    <div style="background:white;border-radius:10px;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px;font-weight:bold">Planos disponíveis:</p>
      <p style="margin:4px 0">✂️ <strong>Essencial</strong> — R$ 59/mês (1 barbeiro)</p>
      <p style="margin:4px 0">⭐ <strong>Profissional</strong> — R$ 99/mês (até 5 barbeiros)</p>
      <p style="margin:4px 0">👑 <strong>Premium</strong> — R$ 149/mês (ilimitado)</p>
    </div>
    <div style="text-align:center;margin:32px 0">
      <a href="${origin}/app/dashboard" style="background:#111111;color:#F7F3EC;font-weight:bold;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:16px">
        Escolher meu plano
      </a>
    </div>
    <p style="color:#999;font-size:12px">Precisa de ajuda? <a href="https://wa.me/5562998801004" style="color:#1B3A4B">Fale conosco no WhatsApp</a></p>
  </div>`;
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const origin = req.headers.get('origin') || 'https://gestorbarber.ia.br';
  const now = new Date();

  // Empresas em trial com trial_ate definido
  const { data: trials, error } = await supabase
    .from('companies')
    .select('id, name, owner_email, trial_ate, trial_warning_sent, trial_expired_email_sent')
    .eq('status_cobranca', 'trial')
    .not('trial_ate', 'is', null)
    .not('owner_email', 'is', null);

  if (error) return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });

  const results = { warning: 0, expired: 0, skipped: 0 };

  for (const company of (trials ?? [])) {
    const trialEnd = new Date(company.trial_ate);
    const msLeft = trialEnd.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

    // E-mail de expiração (trial acabou há menos de 25h)
    if (daysLeft <= 0 && msLeft > -1000 * 60 * 60 * 25 && !company.trial_expired_email_sent) {
      await sendEmail(
        company.owner_email,
        '🔒 Seu trial no Gestor Barber encerrou — escolha seu plano',
        expiredEmail(company, origin),
      );
      await supabase.from('companies').update({ trial_expired_email_sent: true }).eq('id', company.id);
      results.expired++;
      continue;
    }

    // E-mail de aviso (2 ou 3 dias restantes)
    if (daysLeft >= 1 && daysLeft <= 3 && !company.trial_warning_sent) {
      await sendEmail(
        company.owner_email,
        `⏰ Seu trial no Gestor Barber termina em ${daysLeft === 1 ? '1 dia' : `${daysLeft} dias`}`,
        warningEmail(company, daysLeft, origin),
      );
      await supabase.from('companies').update({ trial_warning_sent: true }).eq('id', company.id);
      results.warning++;
      continue;
    }

    results.skipped++;
  }

  return Response.json({ ok: true, ...results, total: (trials ?? []).length }, { headers: corsHeaders });
});
