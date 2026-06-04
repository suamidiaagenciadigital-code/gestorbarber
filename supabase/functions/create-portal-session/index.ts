import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return Response.json({ error: 'Stripe não configurado.' }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json();
  const { company_id, return_url } = body;

  if (!company_id) {
    return Response.json({ error: 'company_id obrigatório.' }, { status: 400, headers: corsHeaders });
  }

  // Busca stripe_customer_id da empresa
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('stripe_customer_id, nome_fantasia')
    .eq('id', company_id)
    .single();

  if (companyErr || !company?.stripe_customer_id) {
    return Response.json(
      { error: 'Assinatura Stripe não encontrada para esta empresa.' },
      { status: 404, headers: corsHeaders }
    );
  }

  const returnUrl = return_url || 'https://gestorbarber.ia.br/app/dashboard';

  // Cria sessão do Customer Portal
  const params = new URLSearchParams({
    customer: company.stripe_customer_id,
    return_url: returnUrl,
  });

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const session = await res.json();

  if (!res.ok) {
    console.error('[create-portal-session] Stripe error:', session.error);
    return Response.json(
      { error: session.error?.message || 'Erro ao criar sessão do portal.' },
      { status: 500, headers: corsHeaders }
    );
  }

  return Response.json({ url: session.url }, { headers: corsHeaders });
});
