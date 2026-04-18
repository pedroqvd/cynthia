-- ================================================================
-- Migration 002: Tabelas e colunas faltantes
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- LEADS — colunas adicionais para CRM odontológico
-- ────────────────────────────────────────────────────────────────
alter table leads
  add column if not exists cpf             text,
  add column if not exists data_nascimento date,
  add column if not exists convenio        text,
  add column if not exists indicado_por    text;

-- ────────────────────────────────────────────────────────────────
-- APPOINTMENTS — coluna de controle de avaliação enviada
-- ────────────────────────────────────────────────────────────────
alter table appointments
  add column if not exists avaliacao_enviada boolean not null default false;

-- ────────────────────────────────────────────────────────────────
-- POSTS (blog)
-- ────────────────────────────────────────────────────────────────
create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  excerpt     text,
  content     text,
  cover_image text,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_posts_slug       on posts(slug);
create index if not exists idx_posts_published  on posts(published, created_at desc);

create trigger posts_updated_at
  before update on posts
  for each row execute function update_updated_at();

alter table posts enable row level security;

create policy "Posts: leitura pública dos publicados"
  on posts for select
  using (published = true);

create policy "Posts: acesso total para autenticados"
  on posts for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────────
-- USER ROLES
-- ────────────────────────────────────────────────────────────────
create table if not exists user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'secretaria' check (role in ('admin', 'secretaria')),
  nome       text,
  updated_at timestamptz not null default now()
);

alter table user_roles enable row level security;

create policy "UserRoles: leitura para autenticados"
  on user_roles for select
  to authenticated
  using (true);

create policy "UserRoles: gerenciamento pelo service_role"
  on user_roles for all
  to service_role
  using (true);

-- ────────────────────────────────────────────────────────────────
-- FINANCIAL CATEGORIES
-- ────────────────────────────────────────────────────────────────
create table if not exists financial_categories (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  tipo       text not null check (tipo in ('receita', 'despesa')),
  cor        text not null default '#7a7570',
  ordem      integer not null default 0,
  ativo      boolean not null default true,
  created_at timestamptz not null default now()
);

alter table financial_categories enable row level security;

create policy "FinancialCategories: leitura para autenticados"
  on financial_categories for select
  to authenticated
  using (true);

create policy "FinancialCategories: gerenciamento pelo service_role"
  on financial_categories for all
  to service_role
  using (true);

insert into financial_categories (nome, tipo, cor, ordem) values
  ('Consulta',               'receita', '#b8965a', 1),
  ('Procedimento Estético',  'receita', '#c4a882', 2),
  ('Ortodontia',             'receita', '#d4b896', 3),
  ('Outros Serviços',        'receita', '#7a7570', 4),
  ('Aluguel',                'despesa', '#e07070', 1),
  ('Material Clínico',       'despesa', '#e09070', 2),
  ('Salários',               'despesa', '#e0b070', 3),
  ('Marketing',              'despesa', '#70a0e0', 4),
  ('Equipamentos',           'despesa', '#9070e0', 5),
  ('Outros',                 'despesa', '#7a7570', 6)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────
-- FINANCIAL ENTRIES
-- ────────────────────────────────────────────────────────────────
create table if not exists financial_entries (
  id               uuid primary key default gen_random_uuid(),
  tipo             text not null check (tipo in ('receita', 'despesa')),
  descricao        text not null,
  valor            numeric(12, 2) not null,
  data             date not null,
  categoria_id     uuid references financial_categories(id),
  lead_id          uuid references leads(id) on delete set null,
  appointment_id   uuid references appointments(id) on delete set null,
  forma_pagamento  text,
  status           text not null default 'pendente' check (status in ('pendente', 'confirmado', 'cancelado')),
  notas            text,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_financial_entries_data        on financial_entries(data desc);
create index if not exists idx_financial_entries_lead_id     on financial_entries(lead_id);
create index if not exists idx_financial_entries_categoria   on financial_entries(categoria_id);

create trigger financial_entries_updated_at
  before update on financial_entries
  for each row execute function update_updated_at();

alter table financial_entries enable row level security;

create policy "FinancialEntries: leitura para autenticados"
  on financial_entries for select
  to authenticated
  using (true);

create policy "FinancialEntries: insert para autenticados"
  on financial_entries for insert
  to authenticated
  with check (true);

create policy "FinancialEntries: update para autenticados"
  on financial_entries for update
  to authenticated
  using (true);

create policy "FinancialEntries: gerenciamento pelo service_role"
  on financial_entries for all
  to service_role
  using (true);
