import crypto from 'node:crypto';

const SUPABASE_URL     = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Mapeamento price_id → plan_name
const PRICE_TO_PLAN = {
  // Mensal
  price_1TafBkPURVRGZqbhYOlRXF3y: 'Essencial',
  price_1TafFOPURVRGZqbhsswycG79: 'Profissional',
  price_1TafGoPURVRGZqbh2VPtKKEH: 'Premium',
  // Anual
  price_1TebXuPURVRGZqbhUlWpp8JI: 'Essencial',
  price_1TebX2PURVRGZqbhLkHuzUsv: 'Profissional',
  price_1TebVXPURVRGZqbhz7Gs1bGb: 'Premium',
};

function verifyStripeSignature(rawBody, sigHeader, secret) {
  const parts = sigHeader.split(',');
  let timestamp = '';
  const signatures = [];
  for (const part of parts) {
    const [k, v] = part.split('=');
    if (k === 't') timestamp = v;
    if (k === 'v1') signatures.push(v);
  }
  if (!timestamp || !signatures.length) return false;
  const signed = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return signatures.some((s) => s === expected);
}

function sbHeaders() {
  return {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
}

/** Ativa empresa após checkout e salva IDs do Stripe */
async function activateCompany(companyId, planName, stripeCustomerId, stripeSubscriptionId) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] activateCompany: missing env vars');
    return null;
  }
  const body = {
    status: 'active',
    plan_name: planName,
    status_cobranca: 'ativo',
    observacoes_internas: null,
  };
  if (stripeCustomerId)    body.stripe_customer_id    = stripeCustomerId;
  if (stripeSubscriptionId) body.stripe_subscription_id = stripeSubscriptionId;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error('[stripe-webhook] activateCompany failed', res.status, await res.text());
    return null;
  }
  const rows = await res.json();
  return rows?.[0] ?? null;
}

/** Atualiza plan_name quando assinatura muda (upgrade/downgrade via Customer Portal) */
async function updateCompanyPlan(stripeCustomerId, newPlanName, newSubscriptionStatus) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !stripeCustomerId) return null;

  const statusMap = {
    active: 'ativo',
    past_due: 'inadimplente',
    canceled: 'cancelado',
    unpaid: 'inadimplente',
  };

  const body = {
    plan_name: newPlanName,
    status_cobranca: statusMap[newSubscriptionStatus] || 'ativo',
    status: newSubscriptionStatus === 'active' ? 'active' : 'inactive',
  };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?stripe_customer_id=eq.${stripeCustomerId}`,
    { method: 'PATCH', headers: sbHeaders(), body: JSON.stringify(body) }
  );
  if (!res.ok) console.error('[stripe-webhook] updateCompanyPlan failed', res.status, await res.text());
  return res.ok;
}

/** Desativa empresa quando assinatura é cancelada */
async function deactivateCompany(stripeCustomerId) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !stripeCustomerId) return null;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?stripe_customer_id=eq.${stripeCustomerId}`,
    {
      method: 'PATCH',
      headers: sbHeaders(),
      body: JSON.stringify({ status: 'inactive', status_cobranca: 'cancelado' }),
    }
  );
  if (!res.ok) console.error('[stripe-webhook] deactivateCompany failed', res.status, await res.text());
  return res.ok;
}

async function sendWelcomeEmail(company, ownerEmail, planName) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('[stripe-webhook] RESEND_API_KEY not set'); return false; }

  const loginUrl = 'https://gestorbarber.ia.br/admin/login';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:#111111;padding:12px 20px;border-radius:10px">
          <span style="font-size:20px;font-weight:900;color:#F7F3EC">Gestor<span style="color:#C89B3C">Barber</span></span>
        </div>
      </div>
      <h1 style="color:#1B1C1E;font-size:22px;margin-bottom:8px">Pagamento confirmado! ✂️</h1>
      <p style="color:#555;margin-bottom:20px">
        Olá, <strong>${company?.owner_nome || company?.nome_fantasia || 'responsável'}</strong>!<br>
        Seu pagamento foi confirmado e sua conta já está <strong>ativa</strong>.
      </p>
      <div style="background:#1B3A4B;color:white;padding:20px;border-radius:10px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Barbearia</p>
        <p style="margin:0 0 14px;font-weight:bold">${company?.nome_fantasia || company?.name || ''}</p>
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Plano ativo</p>
        <p style="margin:0 0 14px;font-weight:bold">${planName}</p>
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Acesse seu painel</p>
        <p style="margin:0"><a href="${loginUrl}" style="color:#7CB9D4">${loginUrl}</a></p>
      </div>
      <p style="color:#888;font-size:13px;text-align:center">
        Dúvidas? Fale conosco em <a href="mailto:contato@gestorbarber.ia.br" style="color:#1B3A4B">contato@gestorbarber.ia.br</a>
      </p>
    </div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Gestor Barber <noreply@gestorbarber.ia.br>',
        to: ownerEmail,
        subject: `✅ Pagamento confirmado — Bem-vindo ao GestorBarber!`,
        html,
      }),
    });
    if (!res.ok) console.error('[stripe-webhook] sendWelcomeEmail failed', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('[stripe-webhook] sendWelcomeEmail exception', e);
    return false;
  }
}

async function sendUpgradeEmail(stripeCustomerId, newPlanName) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !SUPABASE_URL || !SERVICE_ROLE_KEY) return;

  // Busca e-mail do responsável
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/companies?stripe_customer_id=eq.${stripeCustomerId}&select=owner_email,nome_fantasia,owner_nome`,
    { headers: sbHeaders() }
  );
  if (!r.ok) return;
  const rows = await r.json();
  const company = rows?.[0];
  if (!company?.owner_email) return;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:#111111;padding:12px 20px;border-radius:10px">
          <span style="font-size:20px;font-weight:900;color:#F7F3EC">Gestor<span style="color:#C89B3C">Barber</span></span>
        </div>
      </div>
      <h1 style="color:#1B1C1E;font-size:22px;margin-bottom:8px">Plano atualizado! 🚀</h1>
      <p style="color:#555;margin-bottom:20px">
        Olá, <strong>${company.owner_nome || company.nome_fantasia}</strong>!<br>
        Seu plano foi atualizado com sucesso.
      </p>
      <div style="background:#1B3A4B;color:white;padding:20px;border-radius:10px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Novo plano</p>
        <p style="margin:0;font-size:20px;font-weight:bold;color:#C89B3C">${newPlanName}</p>
      </div>
      <p style="color:#888;font-size:13px;text-align:center">As novas funcionalidades já estão disponíveis no seu painel.</p>
    </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Gestor Barber <noreply@gestorbarber.ia.br>',
      to: company.owner_email,
      subject: `🚀 Seu plano foi atualizado para ${newPlanName}!`,
      html,
    }),
  });
}

export default async function handler(req, res) {
  console.log('[stripe-webhook] received', req.method, req.url);

  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig    = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let rawBody = '';
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    rawBody = Buffer.concat(chunks).toString('utf8');
  } catch (e) {
    return res.status(400).json({ error: 'Could not read request body' });
  }

  if (!sig || !verifyStripeSignature(rawBody, sig, secret)) {
    console.error('[stripe-webhook] signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  console.log('[stripe-webhook] event type:', event.type);

  try {
    // ── 1. Checkout concluído (novo cliente / nova assinatura) ──────────────
    if (event.type === 'checkout.session.completed') {
      const session             = event.data.object;
      const companyId           = session.metadata?.company_id;
      const planName            = session.metadata?.plan_name || 'Essencial';
      const ownerEmail          = session.customer_email || session.customer_details?.email;
      const stripeCustomerId    = session.customer;
      const stripeSubscriptionId = session.subscription;

      console.log('[stripe-webhook] checkout.session.completed | company:', companyId, '| plan:', planName);

      if (companyId) {
        const company = await activateCompany(companyId, planName, stripeCustomerId, stripeSubscriptionId);
        if (company && ownerEmail) {
          await sendWelcomeEmail(company, ownerEmail, planName);
        }
      }
    }

    // ── 2. Assinatura atualizada (upgrade/downgrade via Customer Portal) ───
    if (event.type === 'customer.subscription.updated') {
      const sub              = event.data.object;
      const stripeCustomerId = sub.customer;
      const priceId          = sub.items?.data?.[0]?.price?.id;
      const newPlanName      = PRICE_TO_PLAN[priceId];
      const subStatus        = sub.status; // 'active', 'past_due', etc.

      console.log('[stripe-webhook] subscription.updated | customer:', stripeCustomerId, '| price:', priceId, '| plan:', newPlanName);

      if (stripeCustomerId && newPlanName) {
        const prevPlanName = event.data.previous_attributes?.items?.data?.[0]?.price?.id
          ? PRICE_TO_PLAN[event.data.previous_attributes.items.data[0].price.id]
          : null;

        await updateCompanyPlan(stripeCustomerId, newPlanName, subStatus);

        // Envia e-mail só se realmente mudou de plano
        if (prevPlanName && prevPlanName !== newPlanName && subStatus === 'active') {
          await sendUpgradeEmail(stripeCustomerId, newPlanName);
        }
      }
    }

    // ── 3. Assinatura cancelada ─────────────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub              = event.data.object;
      const stripeCustomerId = sub.customer;
      console.log('[stripe-webhook] subscription.deleted | customer:', stripeCustomerId);
      if (stripeCustomerId) await deactivateCompany(stripeCustomerId);
    }

    // ── 4. Pagamento falhou ─────────────────────────────────────────────────
    if (event.type === 'invoice.payment_failed') {
      const invoice          = event.data.object;
      const stripeCustomerId = invoice.customer;
      console.log('[stripe-webhook] invoice.payment_failed | customer:', stripeCustomerId);
      if (stripeCustomerId) {
        await updateCompanyPlan(stripeCustomerId, null, 'past_due');
      }
    }

  } catch (e) {
    console.error('[stripe-webhook] Error processing event:', e.message, e.stack);
  }

  return res.status(200).json({ received: true });
}

export const config = { api: { bodyParser: false } };
