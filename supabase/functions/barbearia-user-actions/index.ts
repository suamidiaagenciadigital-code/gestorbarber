import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

// ── Password helpers (same algo as original barbeariaUserActions.ts) ──────────

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
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `sha256$${salt}$${hashHex}`;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const parts = hash.split('$');
  if (parts.length !== 3 || parts[0] !== 'sha256') return false;
  const [, salt, storedHash] = parts;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex === storedHash;
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
  } catch (e) {
    console.warn('[send-email] Error:', e);
    return false;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const body = await req.json();
  const { action } = body;

  // ── login ────────────────────────────────────────────────────────
  if (action === 'login') {
    const { email, senha } = body;
    const { data: users } = await supabase
      .from('barbearia_users')
      .select('*')
      .eq('email', email)
      .limit(1);
    if (!users?.length) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401, headers: corsHeaders });
    }
    const bu = users[0];
    if (!bu.ativo) {
      return Response.json({ error: 'Usuário inativo' }, { status: 403, headers: corsHeaders });
    }
    const valid = await verifyPassword(senha, bu.senha_hash);
    if (!valid) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401, headers: corsHeaders });
    }

    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .eq('id', bu.barbearia_id)
      .limit(1);
    const company = companies?.[0];

    if (company && company.status === 'pending_payment') {
      return Response.json(
        { error: 'pagamento_pendente', company_id: company.id },
        { status: 403, headers: corsHeaders },
      );
    }

    if (company && (company.status === 'blocked' || company.status_cobranca === 'suspenso' || company.status_cobranca === 'cancelado')) {
      return Response.json(
        { error: 'acesso_suspenso', company_status: company.status_cobranca || company.status },
        { status: 403, headers: corsHeaders },
      );
    }

    await supabase
      .from('barbearia_users')
      .update({ ultimo_login: new Date().toISOString() })
      .eq('id', bu.id);

    return Response.json({
      success: true,
      user: { id: bu.id, email: bu.email, role: bu.role, barbearia_id: bu.barbearia_id, forcar_troca_senha: bu.forcar_troca_senha },
      company: company ? { id: company.id, name: company.nome_fantasia || company.name, slug: company.slug } : null,
    }, { headers: corsHeaders });
  }

  // ── forgot_password ──────────────────────────────────────────────
  if (action === 'forgot_password') {
    const { email } = body;
    const { data: users } = await supabase.from('barbearia_users').select('*').eq('email', email).limit(1);
    if (!users?.length) return Response.json({ success: true }, { headers: corsHeaders });

    const bu = users[0];
    const token = crypto.randomUUID().replace(/-/g, '');
    const expira = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    await supabase.from('barbearia_users').update({ token_reset: token, token_reset_expira_em: expira }).eq('id', bu.id);

    const origin = body.origin || req.headers.get('origin') || 'https://gestorbarber.com.br';
    const resetUrl = `${origin}/admin/reset-senha?token=${token}`;
    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <h2 style="color:#1B3A4B">Gestor Barber — Redefinição de senha</h2>
      <p>Clique no link abaixo para redefinir sua senha. O link expira em 2 horas.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#1B3A4B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">Redefinir senha</a>
      <p style="color:#999;font-size:12px">Se você não solicitou isso, ignore este e-mail.</p>
    </div>`;
    await sendEmail(email, 'Gestor Barber — Redefinição de senha', emailBody);

    return Response.json({ success: true }, { headers: corsHeaders });
  }

  // ── reset_password ───────────────────────────────────────────────
  if (action === 'reset_password') {
    const { token, nova_senha } = body;
    const { data: users } = await supabase.from('barbearia_users').select('*').eq('token_reset', token).limit(1);
    if (!users?.length) return Response.json({ error: 'Token inválido' }, { status: 400, headers: corsHeaders });

    const bu = users[0];
    if (new Date(bu.token_reset_expira_em) < new Date()) {
      return Response.json({ error: 'Token expirado' }, { status: 400, headers: corsHeaders });
    }
    const senha_hash = await hashPassword(nova_senha);
    await supabase.from('barbearia_users').update({
      senha_hash, token_reset: null, token_reset_expira_em: null, forcar_troca_senha: false,
    }).eq('id', bu.id);

    return Response.json({ success: true }, { headers: corsHeaders });
  }

  // ── change_password ──────────────────────────────────────────────
  if (action === 'change_password') {
    const { user_id, nova_senha } = body;
    const senha_hash = await hashPassword(nova_senha);
    await supabase.from('barbearia_users').update({ senha_hash, forcar_troca_senha: false }).eq('id', user_id);
    return Response.json({ success: true }, { headers: corsHeaders });
  }

  // ── reenviar_credenciais ─────────────────────────────────────────
  if (action === 'reenviar_credenciais') {
    // Requires super admin auth — validate via Supabase Auth JWT
    const authHeader = req.headers.get('authorization') ?? '';
    const { data: { user: callerUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!callerUser) return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders });

    const { company_id } = body;
    const { data: companies } = await supabase.from('companies').select('*').eq('id', company_id).limit(1);
    if (!companies?.length) return Response.json({ error: 'Empresa não encontrada' }, { status: 404, headers: corsHeaders });
    const company = companies[0];

    const { data: users } = await supabase.from('barbearia_users').select('*').eq('barbearia_id', company_id).eq('role', 'owner').limit(1);
    if (!users?.length) return Response.json({ error: 'Owner não encontrado' }, { status: 404, headers: corsHeaders });
    const bu = users[0];

    const nova_senha = generatePassword();
    const senha_hash = await hashPassword(nova_senha);
    await supabase.from('barbearia_users').update({ senha_hash, forcar_troca_senha: true }).eq('id', bu.id);

    const origin = body.origin || req.headers.get('origin') || 'https://gestorbarber.com.br';
    const adminUrl = `${origin}/admin/login`;
    const emailBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F8F7F3;padding:32px;border-radius:12px">
      <h2 style="color:#1B3A4B">Credenciais reenviadas — Gestor Barber</h2>
      <div style="background:#1B3A4B;color:white;padding:20px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Link</p><p style="margin:0 0 12px"><a href="${adminUrl}" style="color:#7CB9D4">${adminUrl}</a></p>
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Login</p><p style="margin:0 0 12px;font-weight:bold">${bu.email}</p>
        <p style="margin:0 0 8px;font-size:13px;opacity:.7">Nova senha temporária</p><p style="margin:0;font-size:20px;font-weight:bold;letter-spacing:2px">${nova_senha}</p>
      </div>
      <p style="color:#666;font-size:13px">⚠️ Você será solicitado a trocar sua senha no próximo acesso.</p>
    </div>`;
    const email_enviado = await sendEmail(bu.email, 'Gestor Barber — Credenciais reenviadas', emailBody);

    return Response.json({ success: true, nova_senha, email_enviado }, { headers: corsHeaders });
  }

  // ── forcar_reset_senha ───────────────────────────────────────────
  if (action === 'forcar_reset_senha') {
    const { user_id } = body;
    await supabase.from('barbearia_users').update({ forcar_troca_senha: true }).eq('id', user_id);
    return Response.json({ success: true }, { headers: corsHeaders });
  }

  return Response.json({ error: 'Ação desconhecida' }, { status: 400, headers: corsHeaders });
});
