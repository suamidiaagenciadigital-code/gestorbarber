import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

function generatePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$%&*!';
  const all = upper + lower + digits + special;
  const pwd: string[] = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ];
  for (let i = 4; i < 12; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
  for (let i = pwd.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }
  return pwd.join('');
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256$${salt}$${hashHex}`;
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) { console.warn('[send-email] RESEND_API_KEY not set'); return false; }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Gestor Barber <noreply@gestorbarber.com.br>', to, subject, html: body }),
    });
    return res.ok;
  } catch { return false; }
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Verify super admin JWT
  const authHeader = req.headers.get('authorization') ?? '';
  const { data: { user: callerUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!callerUser) return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });

  // Check super admin
  const { data: config } = await supabase.from('app_configs').select('super_admin_emails').limit(1).maybeSingle();
  if (!config?.super_admin_emails?.includes(callerUser.email)) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });
  }

  const body = await req.json();
  const {
    name, nome_fantasia, razao_social, cnpj, inscricao_estadual,
    email_contato, telefone_comercial, whatsapp, slug, endereco,
    owner_nome, owner_cpf, owner_email, owner_telefone, owner_data_nascimento,
    plano, ciclo, valor, data_inicio, proximo_vencimento, status_cobranca,
    trial_ate, forma_pagamento, observacoes_internas, limite_usuarios,
    gerar_senha_automatica = true, enviar_credenciais_email = true,
  } = body;

  if (!owner_email) return Response.json({ error: 'owner_email obrigatório' }, { status: 400, headers: corsHeaders });
  if (!slug) return Response.json({ error: 'slug obrigatório' }, { status: 400, headers: corsHeaders });

  const { data: existingSlug } = await supabase.from('companies').select('id').eq('slug', slug).limit(1);
  if (existingSlug?.length) return Response.json({ error: 'Slug já está em uso por outra barbearia.' }, { status: 400, headers: corsHeaders });

  const { data: existingUser } = await supabase.from('barbearia_users').select('id').eq('email', owner_email).limit(1);
  if (existingUser?.length) return Response.json({ error: 'E-mail já cadastrado como usuário de outra barbearia.' }, { status: 400, headers: corsHeaders });

  const { data: company, error: companyErr } = await supabase.from('companies').insert({
    name: nome_fantasia || name, nome_fantasia, razao_social, cnpj, inscricao_estadual,
    email_contato, telefone_comercial, whatsapp, slug, endereco,
    owner_nome, owner_cpf, owner_email, owner_telefone, owner_data_nascimento,
    plano: plano || 'starter', ciclo: ciclo || 'mensal', valor, data_inicio,
    proximo_vencimento, status_cobranca: status_cobranca || 'trial', trial_ate,
    forma_pagamento, observacoes_internas, limite_usuarios: limite_usuarios || 3,
    status: 'active', onboarding_completed: false, onboarding_step: 1,
  }).select().single();

  if (companyErr) return Response.json({ error: companyErr.message }, { status: 500, headers: corsHeaders });

  let senha_gerada: string | null = null;
  if (gerar_senha_automatica) {
    senha_gerada = generatePassword();
    const senha_hash = await hashPassword(senha_gerada);
    await supabase.from('barbearia_users').insert({
      barbearia_id: company.id, email: owner_email, senha_hash, role: 'owner', ativo: true, forcar_troca_senha: true,
    });
  }

  let email_enviado = false;
  if (enviar_credenciais_email && senha_gerada) {
    const origin = req.headers.get('origin') || 'https://gestorbarber.com.br';
    const adminUrl = `${origin}/admin/login`;
    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <h1 style="color:#1B3A4B">Boas-vindas ao Gestor Barber! ✂️</h1>
      <p>Olá, <strong>${owner_nome || 'responsável'}</strong>!</p>
      <p>Sua barbearia <strong>${nome_fantasia || name}</strong> foi cadastrada com sucesso.</p>
      <div style="background:#1B3A4B;color:white;padding:20px;border-radius:8px;margin:24px 0">
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Link de acesso</p>
        <p style="margin:0 0 16px"><a href="${adminUrl}" style="color:#7CB9D4">${adminUrl}</a></p>
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Login</p>
        <p style="margin:0 0 16px;font-weight:bold">${owner_email}</p>
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Senha temporária</p>
        <p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:2px">${senha_gerada}</p>
      </div>
      <p style="color:#666;font-size:13px">⚠️ Você será solicitado a trocar sua senha no primeiro acesso.</p>
    </div>`;
    email_enviado = await sendEmail(owner_email, 'Boas-vindas ao Gestor Barber — Suas credenciais de acesso', emailBody);
  }

  return Response.json(
    { success: true, company_id: company.id, senha_gerada: gerar_senha_automatica ? senha_gerada : null, email_enviado },
    { headers: corsHeaders },
  );
});
