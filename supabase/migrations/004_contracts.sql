-- ================================================================
-- Migration 004: Contratos de pacientes + categoria Atendimento
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- Adiciona categoria "Atendimento" em receitas
-- ────────────────────────────────────────────────────────────────
insert into financial_categories (nome, tipo, cor, ordem) values
  ('Atendimento', 'receita', '#a07850', 5)
on conflict do nothing;

-- ────────────────────────────────────────────────────────────────
-- CONTRATOS — registra acordos financeiros por paciente
-- ────────────────────────────────────────────────────────────────
create table if not exists contratos (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  descricao      text not null,
  valor_total    numeric(12, 2) not null,
  parcelas       integer not null default 1,
  valor_entrada  numeric(12, 2) not null default 0,
  data_inicio    date not null default current_date,
  status         text not null default 'ativo'
                   check (status in ('ativo', 'quitado', 'cancelado')),
  notas          text,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists idx_contratos_lead_id on contratos(lead_id);
create index if not exists idx_contratos_status  on contratos(status);

create trigger contratos_updated_at
  before update on contratos
  for each row execute function update_updated_at();

alter table contratos enable row level security;

create policy "Contratos: leitura para autenticados"
  on contratos for select
  to authenticated
  using (true);

create policy "Contratos: insert para autenticados"
  on contratos for insert
  to authenticated
  with check (true);

create policy "Contratos: update para autenticados"
  on contratos for update
  to authenticated
  using (true);

create policy "Contratos: delete para autenticados"
  on contratos for delete
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────
-- FINANCIAL_ENTRIES — colunas de parcelamento e contrato
-- ────────────────────────────────────────────────────────────────
alter table financial_entries
  add column if not exists contrato_id    uuid references contratos(id) on delete set null,
  add column if not exists parcela_numero integer,
  add column if not exists parcelas_total integer;

create index if not exists idx_financial_entries_contrato on financial_entries(contrato_id);
