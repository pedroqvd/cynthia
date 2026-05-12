-- ================================================================
-- PATCH: aplicar após erro 42710 (trigger já existia)
-- Cole este SQL no Supabase SQL Editor e execute
-- ================================================================

-- ────────────────────────────────────────────────────────────────
-- Parte 1: Políticas RLS da tabela contratos (migration 004)
-- O trigger já existia, mas as policies e colunas podem não ter sido aplicadas
-- ────────────────────────────────────────────────────────────────

alter table contratos enable row level security;

drop policy if exists "Contratos: leitura para autenticados" on contratos;
create policy "Contratos: leitura para autenticados"
  on contratos for select
  to authenticated
  using (true);

drop policy if exists "Contratos: insert para autenticados" on contratos;
create policy "Contratos: insert para autenticados"
  on contratos for insert
  to authenticated
  with check (true);

drop policy if exists "Contratos: update para autenticados" on contratos;
create policy "Contratos: update para autenticados"
  on contratos for update
  to authenticated
  using (true);

drop policy if exists "Contratos: delete para autenticados" on contratos;
create policy "Contratos: delete para autenticados"
  on contratos for delete
  to authenticated
  using (true);

-- Colunas de parcelamento em financial_entries
alter table financial_entries
  add column if not exists contrato_id    uuid references contratos(id) on delete set null,
  add column if not exists parcela_numero integer,
  add column if not exists parcelas_total integer;

create index if not exists idx_financial_entries_contrato on financial_entries(contrato_id);

-- ────────────────────────────────────────────────────────────────
-- Parte 2: Migration 005 completa (analytics + open finance)
-- ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('instagram','tiktok','linkedin','x','facebook')),
  periodo date NOT NULL,
  seguidores integer DEFAULT 0,
  novos_seguidores integer DEFAULT 0,
  alcance integer DEFAULT 0,
  impressoes integer DEFAULT 0,
  engajamento numeric(5,2) DEFAULT 0,
  curtidas integer DEFAULT 0,
  comentarios integer DEFAULT 0,
  compartilhamentos integer DEFAULT 0,
  salvamentos integer DEFAULT 0,
  visitas_perfil integer DEFAULT 0,
  cliques_link integer DEFAULT 0,
  notas text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(platform, periodo)
);
ALTER TABLE social_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_social" ON social_metrics;
CREATE POLICY "admin_social" ON social_metrics FOR ALL USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS bank_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text UNIQUE NOT NULL,
  connector_name text,
  account_name text,
  account_number text,
  account_type text DEFAULT 'CHECKING',
  balance numeric(12,2) DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active','error','updating')),
  last_sync timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_bank" ON bank_connections;
CREATE POLICY "admin_bank" ON bank_connections FOR ALL USING (auth.role() = 'authenticated');
