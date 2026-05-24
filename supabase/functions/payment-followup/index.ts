/**
 * payment-followup
 * Sends follow-up emails to companies stuck at pending_stripe_payment.
 *
 * Automated (called by pg_cron daily):
 *   POST {} → processes all pending companies by age window
 *
 * Manual (called from Master Panel):
 *   POST { action: 'manual', company_id: '...' } → sends immediate reminder to one company
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const PLAN_LABEL: Record<string, string> = {
  starter: 'Essencial',
  pro: 'Profissional',
  premium: 'Premium',
};

async function createCheckoutUrl(company: any, origin: string): Promise<string | null> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return null;

  const planName = PLAN_LABEL[company.plano] || 'Essencial';
  const priceId =
    Deno.env.get(`STRIPE_PRICE_${planName.toUpperCase()}`) ||
    Deno.env.get('STRIPE_PRICE_ESSENCIAL');
  if (!priceId) return null;

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/cadastrar/sucesso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cadastrar`,
    allow_promotion_codes: 'true',
    'metadata[company_id]': company.id,
    'metadata[plan_name]': planName,
    'subscription_data[metadata][company_id]': company.id,
    'subscription_data[metadata][plan_name]': planName,
  });

  if (company.owner_email) params.set('customer_email', company.owner_email);

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await res.json();
    return res.ok ? session.url : null;
  } catch {
    return null;
  }
}

async function sendFollowupEmail(
  to: string,
  ownerName: string,
  companyName: string,
  checkoutUrl: string,
  wave: '24h' | '72h' | 'manual',
): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return false;

  const subject =
    wave === '72h'
      ? `⏰ Última chamada: sua barbearia ainda pode ser transformada`
      : `Ei ${ownerName ? ownerName.split(' ')[0] : ''}, seu acesso ao Gestor Barber está esperando por você 🔑`;

  const ctaLabel = wave === '72h' ? 'Garantir meu acesso agora →' : 'Finalizar meu acesso →';

  const body =
    wave === '72h'
      ? `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F7F3EC;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="560" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.08)">
  <tr><td style="background:#111111;padding:28px 40px;text-align:center">
    <span style="font-size:22px;font-weight:900;color:#F7F3EC;letter-spacing:-0.5px">Gestor<span style="color:#C89B3C">Barber</span></span>
  </td></tr>
  <tr><td style="padding:36px 40px">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1B1C1E">Sua barbearia merece mais do que improviso.</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6258;line-height:1.6">
      Oi${ownerName ? `, ${ownerName.split(' ')[0]}` : ''}! Você criou sua conta na <strong>${companyName}</strong> no Gestor Barber há alguns dias, e queremos muito te ver com tudo funcionando.
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6258;line-height:1.6">
      Seus colegas barbeiros já estão usando a plataforma e conquistando resultados reais:
    </p>
    <table style="margin:0 0 24px;width:100%">
      <tr><td style="padding:8px 0;font-size:14px;color:#1B1C1E">✅ <strong>Fim dos esquecimentos</strong> — lembretes automáticos para seus clientes</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#1B1C1E">✅ <strong>Mais tempo na cadeira</strong> — agenda 100% online, sem ficar no celular</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#1B1C1E">✅ <strong>Crescimento real</strong> — relatórios que mostram onde está o dinheiro</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#1B1C1E">✅ <strong>IA no seu negócio</strong> — sugestões automáticas para fidelizar clientes</td></tr>
    </table>
    <p style="margin:0 0 28px;font-size:15px;color:#6B6258;line-height:1.6">
      Sua vaga está reservada — complete o pagamento agora e comece hoje mesmo.
    </p>
    <table width="100%"><tr><td align="center">
      <a href="${checkoutUrl}" style="display:inline-block;background:#C89B3C;color:#111111;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">${ctaLabel}</a>
    </td></tr></table>
    <p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.6">
      Prefere conversar antes? Estamos no WhatsApp — basta responder este e-mail.<br>
      Caso não queira mais receber nossos e-mails, responda com "cancelar".
    </p>
  </td></tr>
  <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:12px;color:#9CA3AF">© 2025 Gestor Barber · gestorbarber.ia.br</p>
  </td></tr>
</table></td></tr></table>
</body></html>`
      : `<!DOCTYPE html><html lang="pt-BR"><body style="margin:0;padding:0;background:#F7F3EC;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="560" style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid rgba(0,0,0,0.08)">
  <tr><td style="background:#111111;padding:28px 40px;text-align:center">
    <span style="font-size:22px;font-weight:900;color:#F7F3EC;letter-spacing:-0.5px">Gestor<span style="color:#C89B3C">Barber</span></span>
  </td></tr>
  <tr><td style="padding:36px 40px">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:900;color:#1B1C1E">Falta pouco para sua barbearia decolar 🚀</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6258;line-height:1.6">
      Oi${ownerName ? `, ${ownerName.split(' ')[0]}` : ''}! Percebemos que você criou sua conta na <strong>${companyName}</strong>, mas ainda não finalizou o pagamento. Acontece! A vida de barbeiro é corrida mesmo. 😊
    </p>
    <p style="margin:0 0 20px;font-size:15px;color:#6B6258;line-height:1.6">
      Sua conta já está criada e esperando por você. Assim que o pagamento for confirmado, você terá acesso imediato a:
    </p>
    <table style="margin:0 0 24px;width:100%">
      <tr><td style="padding:6px 0;font-size:14px;color:#1B1C1E">📅 Agenda online com link de agendamento próprio</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#1B1C1E">👥 Controle de clientes e histórico de cortes</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#1B1C1E">💰 Gestão financeira e relatórios completos</td></tr>
      <tr><td style="padding:6px 0;font-size:14px;color:#1B1C1E">🤖 IA para crescimento e fidelização automática</td></tr>
    </table>
    <p style="margin:0 0 28px;font-size:15px;color:#6B6258;line-height:1.6">
      É simples e rápido — menos de 2 minutos e você já está dentro.
    </p>
    <table width="100%"><tr><td align="center">
      <a href="${checkoutUrl}" style="display:inline-block;background:#C89B3C;color:#111111;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none">${ctaLabel}</a>
    </td></tr></table>
    <p style="margin:28px 0 0;font-size:13px;color:#9CA3AF;text-align:center;line-height:1.6">
      Qualquer dúvida, é só responder este e-mail. Estamos aqui para ajudar!<br>
      Caso não queira mais receber nossos e-mails, responda com "cancelar".
    </p>
  </td></tr>
  <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:12px;color:#9CA3AF">© 2025 Gestor Barber · gestorbarber.ia.br</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Gestor Barber <noreply@gestorbarber.ia.br>',
        to,
        subject,
        html: body,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function hoursOld(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json().catch(() => ({}));
  const origin = body.origin || 'https://gestorbarber.ia.br';

  // ── Manual reminder for a specific company ──────────────────────────────────
  if (body.action === 'manual' && body.company_id) {
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('id', body.company_id)
      .limit(1);

    const company = companies?.[0];
    if (!company) return Response.json({ error: 'Company not found' }, { status: 404, headers: corsHeaders });

    const checkoutUrl = await createCheckoutUrl(company, origin);
    if (!checkoutUrl) return Response.json({ error: 'Could not create checkout URL' }, { status: 500, headers: corsHeaders });

    const ownerName = company.nome_fantasia || company.name || '';
    const sent = await sendFollowupEmail(company.owner_email, ownerName, company.nome_fantasia || company.name, checkoutUrl, 'manual');

    return Response.json({ success: sent, checkout_url: checkoutUrl }, { headers: corsHeaders });
  }

  // ── Automated: process all pending companies by age window ──────────────────
  const { data: pending = [] } = await supabase
    .from('companies')
    .select('*')
    .eq('observacoes_internas', 'pending_stripe_payment');

  const results = { processed: 0, sent_24h: 0, sent_72h: 0, skipped: 0, errors: 0 };

  for (const company of pending) {
    if (!company.owner_email || !company.created_date) { results.skipped++; continue; }

    const age = hoursOld(company.created_date);
    let wave: '24h' | '72h' | null = null;

    if (age >= 24 && age < 48) wave = '24h';
    else if (age >= 72 && age < 96) wave = '72h';
    else { results.skipped++; continue; }

    const checkoutUrl = await createCheckoutUrl(company, origin);
    if (!checkoutUrl) { results.errors++; continue; }

    const ownerName = company.nome_fantasia || company.name || '';
    const sent = await sendFollowupEmail(company.owner_email, ownerName, company.nome_fantasia || company.name, checkoutUrl, wave);

    if (sent) {
      if (wave === '24h') results.sent_24h++;
      else results.sent_72h++;
    } else {
      results.errors++;
    }
    results.processed++;
  }

  return Response.json({ ok: true, run_at: new Date().toISOString(), ...results }, { headers: corsHeaders });
});
