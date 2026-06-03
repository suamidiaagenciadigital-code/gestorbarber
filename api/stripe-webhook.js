import crypto from 'node:crypto';

// Supabase URL can be VITE_-prefixed (frontend build) or plain (server-only var)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Service role key must be a server-only env var (never VITE_-prefixed)
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function activateCompany(companyId, planName) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('[stripe-webhook] activateCompany: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
    return null;
  }
  const url = `${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      status: 'active',
      plan_name: planName,
      status_cobranca: 'ativo',
      observacoes_internas: null,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[stripe-webhook] activateCompany failed', res.status, text);
    return null;
  }
  const rows = await res.json();
  return rows?.[0] ?? null;
}

async function sendWelcomeEmail(company, ownerEmail, planName) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[stripe-webhook] sendWelcomeEmail: RESEND_API_KEY not set, skipping email');
    return false;
  }

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
    if (!res.ok) {
      const text = await res.text();
      console.error('[stripe-webhook] sendWelcomeEmail failed', res.status, text);
    }
    return res.ok;
  } catch (e) {
    console.error('[stripe-webhook] sendWelcomeEmail exception', e);
    return false;
  }
}

export default async function handler(req, res) {
  console.log('[stripe-webhook] received', req.method, req.url);

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('[stripe-webhook] sig present:', !!sig, '| secret present:', !!secret, '| supabase_url present:', !!SUPABASE_URL, '| service_role present:', !!SERVICE_ROLE_KEY);

  if (!secret) {
    console.error('[stripe-webhook] STRIPE_WEBHOOK_SECRET not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Read raw body — must come before any response
  let rawBody = '';
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    rawBody = Buffer.concat(chunks).toString('utf8');
  } catch (e) {
    console.error('[stripe-webhook] Failed to read request body:', e.message);
    return res.status(400).json({ error: 'Could not read request body' });
  }

  console.log('[stripe-webhook] body length:', rawBody.length);

  if (!sig || !verifyStripeSignature(rawBody, sig, secret)) {
    console.error('[stripe-webhook] signature verification failed');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    console.error('[stripe-webhook] JSON parse failed');
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  console.log('[stripe-webhook] event type:', event.type);

  // Process event — wrapped in try/catch so we always return 200 to Stripe
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const companyId = session.metadata?.company_id;
      const planName = session.metadata?.plan_name || 'Essencial';
      const ownerEmail = session.customer_email || session.customer_details?.email;

      console.log('[stripe-webhook] checkout.session.completed | company:', companyId, '| plan:', planName, '| email:', ownerEmail);

      if (companyId) {
        const company = await activateCompany(companyId, planName);
        if (!company) {
          console.error('[stripe-webhook] Failed to activate company', companyId);
        } else {
          console.log('[stripe-webhook] Company activated:', companyId);
          if (ownerEmail) {
            const sent = await sendWelcomeEmail(company, ownerEmail, planName);
            console.log('[stripe-webhook] Welcome email sent:', sent, 'to', ownerEmail);
          }
        }
      } else {
        console.warn('[stripe-webhook] No company_id in session metadata');
      }
    }
    // Add more event types here as needed (e.g. invoice.payment_failed, customer.subscription.deleted)
  } catch (e) {
    // Internal processing error — still return 200 so Stripe doesn't retry forever
    console.error('[stripe-webhook] Error processing event:', e.message, e.stack);
  }

  return res.status(200).json({ received: true });
}

export const config = { api: { bodyParser: false } };
