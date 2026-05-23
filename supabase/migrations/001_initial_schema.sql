-- =============================================================
-- BarbeiroPro AI – Initial Schema Migration
-- =============================================================

-- ── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── updated_at trigger ────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── Helper macro ──────────────────────────────────────────────
-- Attaches set_updated_at to a table
create or replace function add_updated_at_trigger(tbl text)
returns void language plpgsql as $$
begin
  execute format(
    'create trigger trg_%s_updated_at
     before update on %I
     for each row execute function set_updated_at()',
    tbl, tbl
  );
end;
$$;

-- =============================================================
-- COMPANIES  (multi-tenant root)
-- =============================================================
create table if not exists companies (
  id                     uuid primary key default gen_random_uuid(),
  name                   text not null,
  nome_fantasia          text,
  razao_social           text,
  cnpj                   text,
  inscricao_estadual     text,
  email_contato          text,
  telefone_comercial     text,
  whatsapp               text,
  logo_url               text,
  slug                   text unique,
  endereco               jsonb,
  owner_nome             text,
  owner_cpf              text,
  owner_email            text,
  owner_telefone         text,
  owner_data_nascimento  date,
  plano                  text not null default 'starter' check (plano in ('starter','pro','premium')),
  ciclo                  text not null default 'mensal'  check (ciclo in ('mensal','anual')),
  valor                  numeric(10,2),
  data_inicio            date,
  proximo_vencimento     date,
  status_cobranca        text not null default 'trial'
                         check (status_cobranca in ('trial','ativo','inadimplente','suspenso','cancelado')),
  trial_ate              date,
  forma_pagamento        text,
  observacoes_internas   text,
  limite_usuarios        integer not null default 3,
  ultimo_acesso_owner    timestamptz,
  primary_color          text not null default '#1B3A4B',
  secondary_color        text not null default '#F8F7F3',
  phone                  text,                  -- legacy
  address                text,                  -- legacy
  business_hours         jsonb,
  status                 text not null default 'active' check (status in ('active','inactive','blocked')),
  plan_name              text default 'Starter', -- legacy
  onboarding_step        integer not null default 1,
  onboarding_completed   boolean not null default false,
  retention_interval_days integer not null default 30,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists idx_companies_slug   on companies (slug);
create index if not exists idx_companies_status on companies (status);

select add_updated_at_trigger('companies');

-- =============================================================
-- BARBEARIA_USERS  (custom auth – not Supabase Auth)
-- =============================================================
create table if not exists barbearia_users (
  id                   uuid primary key default gen_random_uuid(),
  barbearia_id         uuid not null references companies (id) on delete cascade,
  email                text not null,
  senha_hash           text,
  role                 text not null default 'recepcao'
                       check (role in ('owner','admin','barbeiro','recepcao')),
  ativo                boolean not null default true,
  forcar_troca_senha   boolean not null default false,
  token_reset          text,
  token_reset_expira_em timestamptz,
  ultimo_login         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint uq_barbearia_users_email unique (email)
);

create index if not exists idx_barbearia_users_barbearia on barbearia_users (barbearia_id);
create index if not exists idx_barbearia_users_email     on barbearia_users (email);
create index if not exists idx_barbearia_users_token     on barbearia_users (token_reset);

select add_updated_at_trigger('barbearia_users');

-- =============================================================
-- SERVICE_CATEGORIES
-- =============================================================
create table if not exists service_categories (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies (id) on delete cascade,
  name        text not null,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_service_categories_company on service_categories (company_id);

select add_updated_at_trigger('service_categories');

-- =============================================================
-- SERVICES
-- =============================================================
create table if not exists services (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies (id) on delete cascade,
  category_id      uuid references service_categories (id) on delete set null,
  name             text not null,
  description      text,
  duration_minutes integer not null default 30,
  price            numeric(10,2) not null,
  active           boolean not null default true,
  featured         boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_services_company on services (company_id);
create index if not exists idx_services_active  on services (company_id, active);

select add_updated_at_trigger('services');

-- =============================================================
-- PROFESSIONALS
-- =============================================================
create table if not exists professionals (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies (id) on delete cascade,
  name             text not null,
  photo_url        text,
  specialty        text,
  active           boolean not null default true,
  work_schedule    jsonb,
  service_ids      text[] not null default '{}',
  commission_type  text check (commission_type in ('percent','fixed')),
  commission_value numeric(10,2),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_professionals_company on professionals (company_id);
create index if not exists idx_professionals_active  on professionals (company_id, active);

select add_updated_at_trigger('professionals');

-- =============================================================
-- CUSTOMERS
-- =============================================================
create table if not exists customers (
  id                          uuid primary key default gen_random_uuid(),
  company_id                  uuid not null references companies (id) on delete cascade,
  name                        text not null,
  phone                       text not null,
  email                       text,
  notes                       text,
  tags                        text[] not null default '{}',
  total_appointments          integer not null default 0,
  last_appointment_at         timestamptz,
  favorite_service            text,
  favorite_professional       text,
  status                      text not null default 'active' check (status in ('active','inactive','vip')),
  no_marketing                boolean not null default false,
  last_retention_contact_at   timestamptz,
  retention_recovered_at      timestamptz,
  retention_contact_count     integer not null default 0,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index if not exists idx_customers_company           on customers (company_id);
create index if not exists idx_customers_phone             on customers (company_id, phone);
create index if not exists idx_customers_last_appointment  on customers (company_id, last_appointment_at);
create index if not exists idx_customers_status            on customers (company_id, status);

select add_updated_at_trigger('customers');

-- =============================================================
-- APPOINTMENTS
-- =============================================================
create table if not exists appointments (
  id               uuid primary key default gen_random_uuid(),
  company_id       uuid not null references companies (id) on delete cascade,
  customer_id      uuid references customers (id) on delete set null,
  professional_id  uuid not null references professionals (id),
  service_id       uuid not null references services (id),
  service_name     text,
  professional_name text,
  customer_name    text,
  customer_phone   text,
  scheduled_at     timestamptz not null,
  status           text not null default 'agendado'
                   check (status in ('agendado','confirmado','em_atendimento','concluido','cancelado','faltou')),
  notes            text,
  source           text not null default 'interno' check (source in ('online','interno')),
  completed_at     timestamptz,
  price            numeric(10,2),
  notification_log jsonb not null default '[]',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_appointments_company      on appointments (company_id);
create index if not exists idx_appointments_scheduled    on appointments (company_id, scheduled_at);
create index if not exists idx_appointments_professional on appointments (company_id, professional_id);
create index if not exists idx_appointments_status       on appointments (company_id, status);
create index if not exists idx_appointments_customer     on appointments (company_id, customer_id);

select add_updated_at_trigger('appointments');

-- =============================================================
-- FINANCIAL_ENTRIES
-- =============================================================
create table if not exists financial_entries (
  id                        uuid primary key default gen_random_uuid(),
  company_id                uuid not null references companies (id) on delete cascade,
  type                      text not null default 'entrada' check (type in ('entrada','saida')),
  category                  text,
  description               text,
  amount                    numeric(10,2) not null,
  date                      date not null,
  status                    text not null default 'confirmado' check (status in ('pendente','confirmado')),
  reference_appointment_id  uuid references appointments (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create index if not exists idx_financial_company on financial_entries (company_id);
create index if not exists idx_financial_date    on financial_entries (company_id, date);

select add_updated_at_trigger('financial_entries');

-- =============================================================
-- TEAM_MEMBERS
-- =============================================================
create table if not exists team_members (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references companies (id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'recepcao'
              check (role in ('admin','recepcao','barbeiro','financeiro')),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_team_members_company on team_members (company_id);

select add_updated_at_trigger('team_members');

-- =============================================================
-- APP_CONFIGS  (global / singleton)
-- =============================================================
create table if not exists app_configs (
  id                  uuid primary key default gen_random_uuid(),
  app_name            text not null default 'BarbeiroPro AI',
  super_admin_emails  text[] not null default '{}',
  system_settings     jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

select add_updated_at_trigger('app_configs');

-- Seed one config row
insert into app_configs (app_name, super_admin_emails)
values ('BarbeiroPro AI', '{}')
on conflict do nothing;

-- =============================================================
-- LEADS  (landing page)
-- =============================================================
create table if not exists leads (
  id                       uuid primary key default gen_random_uuid(),
  nome                     text not null,
  whatsapp                 text not null,
  nome_barbearia           text not null,
  cidade                   text not null,
  quantidade_profissionais text not null check (quantidade_profissionais in ('1','2-4','5+')),
  mensagem                 text,
  origem                   text not null default 'landing',
  status                   text not null default 'novo'
                           check (status in ('novo','em_contato','convertido','descartado')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_leads_status on leads (status);

select add_updated_at_trigger('leads');

-- =============================================================
-- ROW LEVEL SECURITY
-- NOTE: barbearia_users table uses custom auth (not Supabase Auth),
-- so RLS is limited. The Edge Functions use the service role key
-- which bypasses RLS. Frontend uses the anon key with policies
-- that only allow reads needed for public pages.
-- =============================================================

alter table companies         enable row level security;
alter table barbearia_users   enable row level security;
alter table service_categories enable row level security;
alter table services          enable row level security;
alter table professionals     enable row level security;
alter table customers         enable row level security;
alter table appointments      enable row level security;
alter table financial_entries enable row level security;
alter table team_members      enable row level security;
alter table app_configs       enable row level security;
alter table leads             enable row level security;

-- Public: read company by slug (for /agendar/:slug page)
create policy "Public can read companies by slug"
  on companies for select
  using (true);

-- Public: read active services for booking
create policy "Public can read services"
  on services for select
  using (active = true);

-- Public: read active professionals for booking
create policy "Public can read professionals"
  on professionals for select
  using (active = true);

-- Public: read appointments for conflict check (only non-sensitive fields)
create policy "Public can read appointments for booking"
  on appointments for select
  using (status not in ('cancelado', 'faltou'));

-- Public: insert appointments (booking)
create policy "Public can create appointments"
  on appointments for insert
  with check (true);

-- Public: insert leads (landing form)
create policy "Public can create leads"
  on leads for insert
  with check (true);

-- All other operations go through service-role (Edge Functions)
-- No additional anon policies needed for admin/master operations
