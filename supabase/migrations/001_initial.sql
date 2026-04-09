-- ================================================================
-- Migration 001: Schema inicial — Dra. Cynthia
-- ================================================================

-- Habilita extensão para UUIDs
create extension if not exists "pgcrypto";

-- ────────────────────────────────────────────────────────────────
-- LEADS
-- ────────────────────────────────────────────────────────────────
create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  whatsapp      text not null unique,
  email         text,
  especialidade text,
  urgencia      text check (urgencia in ('alta', 'media', 'baixa')),
  origem        text default 'whatsapp',
  status        text not null default 'novo'
                  check (status in ('novo', 'em_contato', 'agendado', 'proposta', 'fechado')),
  ticket_estimado numeric(10,2),
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen     timestamptz
);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────────
-- MESSAGES
-- ────────────────────────────────────────────────────────────────
create table if not exists messages (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid references leads(id) on delete set null,
  direction            text not null check (direction in ('in', 'out')),
  content              text not null,
  type                 text not null default 'text'
                         check (type in ('text', 'template', 'interactive', 'image', 'audio')),
  template_name        text,
  whatsapp_message_id  text unique,
  status               text default 'received'
                         check (status in ('sent', 'delivered', 'read', 'failed', 'received')),
  created_at           timestamptz not null default now()
);

create index idx_messages_lead_id on messages(lead_id);
create index idx_messages_created_at on messages(created_at desc);

-- ────────────────────────────────────────────────────────────────
-- APPOINTMENTS
-- ────────────────────────────────────────────────────────────────
create table if not exists appointments (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references leads(id) on delete set null,
  google_event_id  text unique,
  procedimento     text not null,
  data_hora        timestamptz not null,
  duracao_min      integer not null default 60,
  status           text not null default 'agendado'
                     check (status in ('agendado', 'confirmado', 'realizado', 'cancelado')),
  notas            text,
  created_at       timestamptz not null default now()
);

create index idx_appointments_data_hora on appointments(data_hora);
create index idx_appointments_lead_id on appointments(lead_id);

-- ────────────────────────────────────────────────────────────────
-- BEFORE / AFTER (galeria de resultados)
-- ────────────────────────────────────────────────────────────────
create table if not exists before_after (
  id              uuid primary key default gen_random_uuid(),
  procedimento    text not null,
  descricao       text,
  foto_antes_url  text not null,
  foto_depois_url text not null,
  ativo           boolean not null default true,
  ordem           integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ────────────────────────────────────────────────────────────────
-- TESTIMONIALS
-- ────────────────────────────────────────────────────────────────
create table if not exists testimonials (
  id       uuid primary key default gen_random_uuid(),
  nome     text not null,
  cargo    text,
  texto    text not null,
  foto_url text,
  nota     integer not null default 5 check (nota between 1 and 5),
  ativo    boolean not null default true,
  ordem    integer not null default 0
);

-- Depoimentos iniciais
insert into testimonials (nome, cargo, texto, nota, ativo, ordem) values
  ('Ana Clara M.', 'Executiva — Brasília',
   'Passei anos com vergonha do meu sorriso. Em um único lugar, fiz a cirurgia e as facetas. O resultado superou tudo que eu imaginava.',
   5, true, 1),
  ('Roberto S.', 'Empresário — Brasília',
   'Eu precisava de implantes e nunca encontrava alguém que entendesse tanto de cirurgia quanto de estética. A Dra. Cynthia é essa pessoa.',
   5, true, 2),
  ('Luciana F.', 'Médica — Brasília',
   'Sofria com dor na mandíbula há anos. Em três meses de tratamento com ela, resolvi algo que nenhum outro especialista tinha conseguido.',
   5, true, 3);

-- ────────────────────────────────────────────────────────────────
-- ACTIVITY LOG
-- ────────────────────────────────────────────────────────────────
create table if not exists activity_log (
  id        uuid primary key default gen_random_uuid(),
  lead_id   uuid references leads(id) on delete set null,
  user_id   uuid references auth.users(id) on delete set null,
  acao      text not null,
  detalhes  jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_log_lead_id on activity_log(lead_id);
create index idx_activity_log_created_at on activity_log(created_at desc);

-- ────────────────────────────────────────────────────────────────
-- SITE CONFIG (chave-valor para configurações editáveis)
-- ────────────────────────────────────────────────────────────────
create table if not exists site_config (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Valores padrão
insert into site_config (key, value) values
  ('consultorio_nome', 'Dra. Cynthia'),
  ('consultorio_endereco', 'Brasília — Asa Sul, DF'),
  ('consultorio_telefone', '+55 61 9999-9999'),
  ('consultorio_whatsapp', '5561999999999'),
  ('horario_abertura', '08:00'),
  ('horario_fechamento', '18:00'),
  ('hero_headline', 'O sorriso que você quer — feito por quem entende tudo do que envolve.'),
  ('hero_subtitulo', 'Estética dental, cirurgia bucomaxilofacial e prótese. Uma especialista rara que conduz seu caso do início ao fim.'),
  ('sobre_texto', 'Em um mercado onde cada especialidade dental é tratada isoladamente, a Dra. Cynthia construiu uma trajetória rara: domínio profundo em estética dental, cirurgia bucomaxilofacial e reabilitação protética.'),
  ('cro_numero', '00000'),
  ('msg_boasvindas', ''),
  ('msg_ausencia', ''),
  ('msg_lembrete', '')
on conflict (key) do nothing;

-- ────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────

-- Habilita RLS em todas as tabelas
alter table leads enable row level security;
alter table messages enable row level security;
alter table appointments enable row level security;
alter table before_after enable row level security;
alter table testimonials enable row level security;
alter table activity_log enable row level security;
alter table site_config enable row level security;

-- Leads: autenticados têm acesso total
create policy "Leads: acesso total para autenticados"
  on leads for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Messages: insert público (webhook), resto autenticado
create policy "Messages: insert público (webhook)"
  on messages for insert
  with check (true);

create policy "Messages: leitura e atualização para autenticados"
  on messages for select
  using (auth.uid() is not null);

create policy "Messages: update para autenticados"
  on messages for update
  using (auth.uid() is not null);

-- Appointments: autenticados têm acesso total
create policy "Appointments: acesso total para autenticados"
  on appointments for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Before/After: leitura pública, escrita autenticada
create policy "BeforeAfter: leitura pública"
  on before_after for select
  using (ativo = true);

create policy "BeforeAfter: escrita autenticada"
  on before_after for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Testimonials: leitura pública, escrita autenticada
create policy "Testimonials: leitura pública"
  on testimonials for select
  using (ativo = true);

create policy "Testimonials: escrita autenticada"
  on testimonials for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Activity log: autenticados têm acesso total
create policy "ActivityLog: acesso total para autenticados"
  on activity_log for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Site config: leitura pública, escrita autenticada
create policy "SiteConfig: leitura pública"
  on site_config for select
  using (true);

create policy "SiteConfig: escrita autenticada"
  on site_config for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ────────────────────────────────────────────────────────────────
-- Executar no painel do Supabase ou via API:
-- insert into storage.buckets (id, name, public) values
--   ('before_after', 'before_after', true),
--   ('testimonials', 'testimonials', true),
--   ('site', 'site', true);
