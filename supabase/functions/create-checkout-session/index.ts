import { corsHeaders, handleCors } from '../_shared/cors.ts';

const PRICE_IDS: Record<string, string | undefined> = {
  Essencial:    undefined, // set via env STRIPE_PRICE_ESSENCIAL
  Profissional: undefined,
  Premium:      undefined,
};

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return Response.json({ error: 'Stripe não configurado.' }, { status: 500, headers: corsHeaders });
  }

  const body = await req.json();
  const { company_id, plan_name, owner_email, success_url, cancel_url } = body;

  if (!company_id || !plan_name || !success_url) {
    return Response.json({ error: 'Parâmetros ausentes.' }, { status: 400, headers: corsHeaders });
  }

  const priceId =
    Deno.env.get(`STRIPE_PRICE_${plan_name.toUpperCase()}`) ||
    Deno.env.get('STRIPE_PRICE_ESSENCIAL');

  if (!priceId) {
    return Response.json({ error: `Price ID não configurado para o plano ${plan_name}.` }, { status: 500, headers: corsHeaders });
  }

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: success_url,
    cancel_url: cancel_url || success_url,
    allow_promotion_codes: 'true',
    'metadata[company_id]': company_id,
    'metadata[plan_name]': plan_name,
    'subscription_data[metadata][company_id]': company_id,
    'subscription_data[metadata][plan_name]': plan_name,
  });

  if (owner_email) params.set('customer_email', owner_email);

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();

  if (!res.ok) {
    return Response.json({ error: session.error?.message || 'Erro ao criar sessão Stripe.' }, { status: 500, headers: corsHeaders });
  }

  return Response.json({ checkout_url: session.url }, { headers: corsHeaders });
});
