import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256$${salt}$${hashHex}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Gestor Barber <noreply@gestorbarber.com.br>', to, subject, html }),
  });
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json();
  const { barbershop_name, slug, owner_nome, owner_email, password, plan_name } = body;

  if (!barbershop_name || !slug || !owner_email || !password) {
    return Response.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400, headers: corsHeaders });
  }

  // Validate slug format
  if (!/^[a-z0-9]+$/.test(slug)) {
    return Response.json({ error: 'Slug inválido. Use apenas letras minúsculas e números.' }, { status: 400, headers: corsHeaders });
  }

  // Check slug uniqueness
  const { data: existingSlug } = await supabase.from('companies').select('id').eq('slug', slug).limit(1);
  if (existingSlug?.length) {
    return Response.json({ error: 'Este link já está em uso. Escolha outro.' }, { status: 400, headers: corsHeaders });
  }

  // Check email uniqueness
  const { data: existingUser } = await supabase.from('barbearia_users').select('id').eq('email', owner_email).limit(1);
  if (existingUser?.length) {
    return Response.json({ error: 'Este e-mail já está cadastrado.' }, { status: 400, headers: corsHeaders });
  }

  const normalizedPlan = plan_name || 'Essencial';

  // Create company as pending_payment
  const { data: company, error: companyErr } = await supabase.from('companies').insert({
    name: barbershop_name,
    nome_fantasia: barbershop_name,
    slug,
    owner_email,
    owner_nome: owner_nome || null,
    plan_name: normalizedPlan,
    status: 'pending_payment',
    status_cobranca: 'aguardando_pagamento',
    onboarding_completed: false,
    onboarding_step: 1,
  }).select().single();

  if (companyErr) {
    return Response.json({ error: companyErr.message }, { status: 500, headers: corsHeaders });
  }

  // Create barbearia_user with provided password
  const senha_hash = await hashPassword(password);
  const { error: userErr } = await supabase.from('barbearia_users').insert({
    barbearia_id: company.id,
    email: owner_email,
    senha_hash,
    role: 'owner',
    ativo: true,
    forcar_troca_senha: false,
  });

  if (userErr) {
    // Rollback company
    await supabase.from('companies').delete().eq('id', company.id);
    return Response.json({ error: userErr.message }, { status: 500, headers: corsHeaders });
  }

  // Send welcome email
  const origin = req.headers.get('origin') || 'https://gestorbarber.com.br';
  const loginUrl = `${origin}/admin/login`;
  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-block;background:#111111;padding:12px 20px;border-radius:10px">
          <span style="font-size:20px;font-weight:900;color:#F7F3EC">Gestor<span style="color:#C89B3C">Barber</span></span>
        </div>
      </div>
      <h1 style="color:#1B1C1E;font-size:22px;margin-bottom:8px">Bem-vindo, ${owner_nome || barbershop_name}! ✂️</h1>
      <p style="color:#555;margin-bottom:20px">Sua conta foi criada. Após a confirmação do pagamento, seu painel estará ativo.</p>
      <div style="background:#1B3A4B;color:white;padding:20px;border-radius:10px;margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Acesso ao painel</p>
        <p style="margin:0 0 14px"><a href="${loginUrl}" style="color:#7CB9D4">${loginUrl}</a></p>
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">E-mail</p>
        <p style="margin:0 0 14px;font-weight:bold">${owner_email}</p>
        <p style="margin:0 0 6px;font-size:12px;opacity:.6">Plano</p>
        <p style="margin:0;font-weight:bold">${normalizedPlan}</p>
      </div>
      <p style="color:#888;font-size:12px">Após o pagamento ser confirmado (pode levar alguns minutos), seu painel será ativado automaticamente.</p>
    </div>`;

  await sendEmail(owner_email, 'Gestor Barber — Conta criada, finalize seu pagamento', emailHtml);

  return Response.json({ success: true, company_id: company.id }, { headers: corsHeaders });
});
