# Guia de Deploy — BarbeiroPro AI

Stack: **React + Vite** (frontend) · **Supabase** (banco + auth + Edge Functions) · **Vercel** (hosting)

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|------------|---------------|------------|
| Node.js    | 18+           | https://nodejs.org |
| Supabase CLI | latest      | `npm i -g supabase` |
| Vercel CLI  | latest       | `npm i -g vercel` |

Contas necessárias: [Supabase](https://supabase.com), [Vercel](https://vercel.com), [Resend](https://resend.com), [Anthropic](https://console.anthropic.com)

---

## 1. Configurar o Supabase

### 1.1 Criar projeto

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Anote: **Project URL** e as chaves **anon** e **service_role** (Settings → API)

### 1.2 Aplicar o schema do banco

```bash
# Faça login na Supabase CLI
supabase login

# Vincule ao seu projeto (use o Project ID do dashboard)
supabase link --project-ref SEU_PROJECT_ID

# Aplique a migration inicial
supabase db push
```

Isso executa `supabase/migrations/001_initial_schema.sql` criando todas as 11 tabelas, triggers e políticas RLS.

### 1.3 Configurar Auth (super admins)

1. No dashboard Supabase → **Authentication → Providers** → Email: habilite
2. Desabilite "Confirm email" se quiser login imediato em desenvolvimento
3. Crie o primeiro super admin: **Authentication → Users → Add user**
4. No banco, execute:
   ```sql
   INSERT INTO app_configs (app_name, super_admin_emails)
   VALUES ('BarbeiroPro AI', ARRAY['seu-email@exemplo.com']);
   ```

### 1.4 Fazer deploy das Edge Functions

```bash
# Deploy de todas as funções de uma vez
supabase functions deploy barbearia-user-actions
supabase functions deploy create-barbearia
supabase functions deploy appointment-notifications
supabase functions deploy appointment-reminder-scheduler
supabase functions deploy retention-scheduler
supabase functions deploy invoke-llm
```

### 1.5 Configurar secrets das Edge Functions

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxx
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxxx
```

As variáveis `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente.

### 1.6 Configurar cron jobs (agendamentos automáticos)

No dashboard Supabase → **Edge Functions → Schedules**:

| Função | Cron | Descrição |
|--------|------|-----------|
| `appointment-reminder-scheduler` | `0 * * * *` | Lembretes a cada hora |
| `retention-scheduler` | `0 9 * * *` | Retenção diária às 9h |

---

## 2. Configurar variáveis de ambiente locais

```bash
cp .env.example .env
```

Preencha `.env` com os valores reais do seu projeto Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> As variáveis `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `ANTHROPIC_API_KEY`  
> **não** devem ir no `.env` do frontend — ficam apenas nos secrets da Supabase CLI.

---

## 3. Testar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` e verifique:
- `/` — Landing page carrega
- `/demo/dashboard` — Demo funciona sem login
- `/admin/login` — Tela de login da barbearia
- `/master` (como super admin do Supabase Auth)

---

## 4. Deploy no Vercel

### 4.1 Via CLI

```bash
vercel
```

Siga o wizard; quando pedir o framework, escolha **Vite**.

### 4.2 Via dashboard (recomendado)

1. Acesse [vercel.com/new](https://vercel.com/new) → importe o repositório GitHub
2. Framework Preset: **Vite**
3. Em **Environment Variables**, adicione:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon do Supabase |

4. Clique em **Deploy**

O `vercel.json` já está configurado com rewrites SPA e headers de segurança.

### 4.3 Domínio customizado

1. Vercel dashboard → seu projeto → **Domains** → Add
2. Adicione os registros DNS indicados pelo Vercel no seu provedor
3. Aguarde propagação (geralmente < 1h com Cloudflare)

---

## 5. Configurar domínio no Supabase

Para evitar erros de CORS em produção:

1. Supabase dashboard → **Authentication → URL Configuration**
2. **Site URL**: `https://seu-dominio.com`
3. **Redirect URLs**: `https://seu-dominio.com/**`

---

## 6. Criar primeira barbearia

1. Faça login em `/master` com a conta de super admin
2. Vá em **Barbearias → Nova Barbearia**
3. Preencha nome, slug e e-mail do owner
4. O sistema cria automaticamente o usuário `BarbeariaUser` e envia e-mail de boas-vindas

---

## Estrutura de arquivos relevantes

```
BarbeiroPro-AI/
├── supabase/
│   ├── migrations/001_initial_schema.sql   ← Schema completo do banco
│   └── functions/
│       ├── barbearia-user-actions/         ← Auth customizado
│       ├── create-barbearia/               ← Criação de barbearias
│       ├── appointment-notifications/      ← WhatsApp/e-mail notificações
│       ├── appointment-reminder-scheduler/ ← Cron de lembretes
│       ├── retention-scheduler/            ← Cron de retenção
│       └── invoke-llm/                     ← IA Growth (Anthropic)
├── src/
│   ├── api/base44Client.js                 ← Shim Supabase compatível com Base44
│   ├── lib/AuthContext.jsx                 ← Auth dual (Supabase + custom)
│   └── lib/supabase.js                     ← Cliente Supabase
├── .env.example                            ← Modelo de variáveis de ambiente
├── vercel.json                             ← Config SPA + headers
└── vite.config.js                          ← Build config
```

---

## Troubleshooting

**Build falha com "Cannot find module"**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Edge Function retorna 401**  
Verifique se o `SUPABASE_SERVICE_ROLE_KEY` está nos secrets: `supabase secrets list`

**CORS error nas Edge Functions**  
Certifique-se de que o domínio do frontend está em **Authentication → URL Configuration → Redirect URLs** no Supabase.

**E-mails não chegam**  
- Verifique `RESEND_API_KEY` nos secrets da Supabase
- Em produção, adicione e verifique o domínio remetente no Resend dashboard
- O domínio padrão `onboarding@resend.dev` funciona apenas para testes

**Banco vazio após `supabase db push`**  
Execute manualmente: `supabase db push --db-url postgresql://postgres:SENHA@db.ID.supabase.co:5432/postgres`
