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
