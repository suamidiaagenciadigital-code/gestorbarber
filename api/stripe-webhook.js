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
    }),
  });
  return res.ok;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  // Get raw body
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

    if (companyId) {
      const ok = await activateCompany(companyId, planName);
      if (!ok) console.error('[stripe-webhook] Failed to activate company', companyId);
    }
  }

  return res.status(200).json({ received: true });
}

export const config = { api: { bodyParser: false } };
