import crypto from 'node:crypto';

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
  const url = `${process.env.SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] ?? null;
}

async function sendWelcomeEmail(company, ownerEmail, planName) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

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
    return res.ok;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');

  if (!secret || !verifyStripeSignature(rawBody, sig || '', secret)) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const companyId = session.metadata?.company_id;
    const planName = session.metadata?.plan_name || 'Essencial';
    const ownerEmail = session.customer_email || session.customer_details?.email;

    if (companyId) {
      const company = await activateCompany(companyId, planName);
      if (!company) {
        console.error('[stripe-webhook] Failed to activate company', companyId);
      } else if (ownerEmail) {
        const sent = await sendWelcomeEmail(company, ownerEmail, planName);
        if (!sent) console.warn('[stripe-webhook] Welcome email failed for', ownerEmail);
      }
    }
  }

  return res.status(200).json({ received: true });
}

export const config = { api: { bodyParser: false } };
