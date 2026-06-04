import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return Response.json({ error: 'Stripe não configurado.' }, { status: 500, headers: corsHeaders });
  }

  const body = await req.json();
  const {
    company_id,
    plan_name,
    billing_period = 'monthly',   // 'monthly' | 'annual'
    owner_email,
    success_url,
    cancel_url,
    return_url,
    ui_mode = 'hosted',           // 'hosted' | 'embedded'
  } = body;

  if (!company_id || !plan_name) {
    return Response.json({ error: 'Parâmetros ausentes.' }, { status: 400, headers: corsHeaders });
  }

  // Resolve price ID: annual first, fallback to monthly, fallback to Essencial
  const planKey = plan_name.toUpperCase();
  const priceId =
    (billing_period === 'annual' && Deno.env.get(`STRIPE_PRICE_${planKey}_ANNUAL`)) ||
    Deno.env.get(`STRIPE_PRICE_${planKey}`) ||
    Deno.env.get('STRIPE_PRICE_ESSENCIAL');

  if (!priceId) {
    return Response.json(
      { error: `Price ID não configurado para o plano ${plan_name}.` },
      { status: 500, headers: corsHeaders },
    );
  }

  const isEmbedded = ui_mode === 'embedded';

  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    allow_promotion_codes: 'true',
    'metadata[company_id]': company_id,
    'metadata[plan_name]': plan_name,
    'metadata[billing_period]': billing_period,
    'subscription_data[metadata][company_id]': company_id,
    'subscription_data[metadata][plan_name]': plan_name,
    'subscription_data[metadata][billing_period]': billing_period,
  });

  if (isEmbedded) {
    params.set('ui_mode', 'embedded');
    params.set('return_url', return_url || success_url || '');
  } else {
    params.set('success_url', success_url || '');
    params.set('cancel_url', cancel_url || success_url || '');
  }

  if (owner_email) params.set('customer_email', owner_email);

  const stripeHeaders = {
    Authorization: `Bearer ${stripeKey}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: stripeHeaders,
    body: params.toString(),
  });

  const session = await res.json();

  // Se embedded falhou, tenta hosted como fallback
  if (!res.ok && isEmbedded) {
    const fallbackParams = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': priceId,
      'line_items[0][quantity]': '1',
      allow_promotion_codes: 'true',
      'metadata[company_id]': company_id,
      'metadata[plan_name]': plan_name,
      'metadata[billing_period]': billing_period,
      'subscription_data[metadata][company_id]': company_id,
      'subscription_data[metadata][plan_name]': plan_name,
      'subscription_data[metadata][billing_period]': billing_period,
      success_url: return_url || success_url || '',
      cancel_url: return_url || success_url || '',
    });
    if (owner_email) fallbackParams.set('customer_email', owner_email);

    const fallbackRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: stripeHeaders,
      body: fallbackParams.toString(),
    });
    const fallbackSession = await fallbackRes.json();

    if (!fallbackRes.ok) {
      return Response.json(
        { error: fallbackSession.error?.message || session.error?.message || 'Erro ao criar sessão Stripe.' },
        { status: 500, headers: corsHeaders },
      );
    }
    // Retorna checkout_url para o frontend redirecionar
    return Response.json({ checkout_url: fallbackSession.url, fallback: true }, { headers: corsHeaders });
  }

  if (!res.ok) {
    return Response.json(
      { error: session.error?.message || 'Erro ao criar sessão Stripe.' },
      { status: 500, headers: corsHeaders },
    );
  }

  if (isEmbedded) {
    return Response.json({ client_secret: session.client_secret }, { headers: corsHeaders });
  }
  return Response.json({ checkout_url: session.url }, { headers: corsHeaders });
});
